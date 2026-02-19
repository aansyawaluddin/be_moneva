import prisma from '../utils/prisma.js';
import fs from 'fs';
import { getProcessor } from '../services/processors/index.js';

const staffController = {

    // GET JOBDESK
    getJobdesk: async (req, res) => {
        try {
            const userProgramId = req.user.programKerjaId;

            if (!userProgramId) {
                return res.status(400).json({ msg: "Anda belum ditugaskan ke Program Kerja manapun." });
            }

            const programData = await prisma.programKerja.findUnique({
                where: { id: Number(userProgramId) },
                include: {
                    subProgram: {
                        orderBy: { id: 'asc' }
                    }
                }
            });

            if (!programData) {
                return res.status(404).json({ msg: "Data Program Kerja tidak ditemukan." });
            }

            const result = {
                programKerja: {
                    id: programData.id,
                    namaProgram: programData.namaProgram,
                    slug: programData.slug,
                    deskripsiProgram: programData.deskripsi,
                },
                daftarSubProgram: programData.subProgram.map(sub => ({
                    id: sub.id,
                    namaSubProgram: sub.namaSubProgram,
                    slug: sub.slug,
                    target: sub.target,
                    anggaran: sub.anggaran.toString(),
                }))
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    // UPLOAD LAPORAN
    uploadLaporan: async (req, res) => {
        try {
            const file = req.file;
            const { subProgramId, jalur, namaLaporan } = req.body;
            const userProgramId = req.user.programKerjaId;

            if (!file) return res.status(400).json({ msg: "File Excel wajib diupload" });

            if (!subProgramId || isNaN(Number(subProgramId))) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(400).json({
                    msg: "Sub Program ID kosong atau tidak valid. Pastikan urutan pengiriman FormData benar (Teks/ID ditaruh di atas, File ditaruh paling bawah)."
                });
            }

            const subProgramCheck = await prisma.subProgramKerja.findFirst({
                where: {
                    id: Number(subProgramId),
                    programKerjaId: Number(userProgramId)
                }
            });

            if (!subProgramCheck) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(403).json({ msg: "Anda tidak berhak mengupload laporan untuk Sub Program ini." });
            }

            let headerId;

            await prisma.$transaction(async (tx) => {
                const header = await tx.dataRealisasi.create({
                    data: {
                        subProgramId: Number(subProgramId),
                        namaLaporan: namaLaporan,
                        jalur: jalur || null,
                        diInputOleh: req.user.id,
                        statusVerifikasi: 'Menunggu',
                        tanggalInput: new Date(),
                        buktiDukung: file.filename
                    }
                });

                headerId = header.id;

                const processor = getProcessor(subProgramCheck.namaSubProgram);
                if (processor) {
                    await processor(tx, header.id, file.path);
                } else {
                    throw new Error(`Prosesor Excel tidak ditemukan untuk: ${subProgramCheck.namaSubProgram}`);
                }
            });

            const savedData = await prisma.dataRealisasi.findUnique({ where: { id: headerId } });

            res.status(201).json({
                status: "success",
                msg: "Laporan berhasil diupload dan diekstrak. Menunggu verifikasi atasan.",
                data: savedData
            });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            console.error(error);
            res.status(500).json({ msg: "Gagal upload atau format Excel salah", error: error.message });
        }
    },

    // RIWAYAT UPLOAD SAYA
    getMyUploads: async (req, res) => {
        try {
            const { slug } = req.params;
            const userId = req.user.id;
            const userProgramId = req.user.programKerjaId;

            const subProgram = await prisma.subProgramKerja.findUnique({
                where: { slug: slug }
            });

            if (!subProgram) {
                return res.status(404).json({ msg: "Sub Program tidak ditemukan." });
            }

            if (subProgram.programKerjaId !== userProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Anda tidak ditugaskan di Sub Program ini." });
            }

            const data = await prisma.dataRealisasi.findMany({
                where: {
                    diInputOleh: userId,
                    subProgramId: subProgram.id
                },
                orderBy: { tanggalInput: 'desc' },
                include: {
                    subProgram: { select: { namaSubProgram: true, slug: true } },
                    verifikator: { select: { username: true } }
                }
            });

            res.json({
                status: "success",
                subProgram: subProgram.namaSubProgram,
                data: data
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    // DETAIL LAPORAN
    getDetailLaporan: async (req, res) => {
        try {
            const { slug, id } = req.params;
            const userProgramId = req.user.programKerjaId;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: {
                    subProgram: { select: { namaSubProgram: true, programKerjaId: true, slug: true } },
                    verifikator: { select: { username: true } },
                    detailBosda: true,
                    detailSpp: true,
                    detailPrakerin: true,
                    detailBeasiswa: true,
                    detailDigital: true,
                    detailVokasi: true,
                    detailCareer: true,
                    detailSeragam: true,
                    detailIplm: true 
                }
            });

            if (!headerData) {
                return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            }

            if (headerData.subProgram.slug !== slug) {
                return res.status(404).json({ msg: "Laporan ini tidak termasuk dalam sub program tersebut." });
            }

            if (headerData.subProgram.programKerjaId !== userProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan wilayah kerja Anda." });
            }

            let detailItems = [];
            let tipeLaporan = "";

            if (headerData.detailBosda?.length > 0) { detailItems = headerData.detailBosda; tipeLaporan = "BOSDA"; }
            else if (headerData.detailSpp?.length > 0) { detailItems = headerData.detailSpp; tipeLaporan = "SPP"; }
            else if (headerData.detailPrakerin?.length > 0) { detailItems = headerData.detailPrakerin; tipeLaporan = "Prakerin"; }
            else if (headerData.detailBeasiswa?.length > 0) { detailItems = headerData.detailBeasiswa; tipeLaporan = "Beasiswa"; }
            else if (headerData.detailDigital?.length > 0) { detailItems = headerData.detailDigital; tipeLaporan = "Digitalisasi"; }
            else if (headerData.detailVokasi?.length > 0) { detailItems = headerData.detailVokasi; tipeLaporan = "Vokasi"; }
            else if (headerData.detailCareer?.length > 0) { detailItems = headerData.detailCareer; tipeLaporan = "Career Center"; }
            else if (headerData.detailSeragam?.length > 0) { detailItems = headerData.detailSeragam; tipeLaporan = "Seragam"; }
            else if (headerData.detailIplm?.length > 0) { detailItems = headerData.detailIplm; tipeLaporan = "IPLM"; } 

            const parseNominal = (val) => val ? Number(val.toString()) : 0;

            detailItems = detailItems.map(item => {
                let formattedItem = { ...item };

                if (tipeLaporan === "Prakerin") {
                    formattedItem.nominal = parseNominal(item.realisasiNegeri) + parseNominal(item.realisasiSwasta);
                } else {
                    formattedItem.nominal = parseNominal(item.nominal);
                }

                return formattedItem;
            });

            const result = {
                header: {
                    id: headerData.id,
                    namaLaporan: headerData.namaLaporan,
                    subProgram: headerData.subProgram.namaSubProgram,
                    jalur: headerData.jalur || '-',
                    status: headerData.statusVerifikasi,
                    catatanRevisi: headerData.catatanRevisi || '-',
                    verifikator: headerData.verifikator?.username || '-',
                    tanggalInput: headerData.tanggalInput,
                    tanggalVerifikasi: headerData.tanggalVerifikasi || '-',
                    buktiDukung: headerData.buktiDukung,
                    tipe: tipeLaporan
                },
                items: detailItems
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default staffController;