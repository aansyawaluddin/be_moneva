import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { getProcessor } from '../services/processors/index.js';

const kadisController = {

    getJobdesk: async (req, res) => {
        try {
            const userSubProgramId = req.user.subProgramId;

            if (!userSubProgramId) {
                return res.status(200).json({
                    status: "success",
                    msg: "Anda adalah Kadis Umum / Belum ditugaskan ke Sub Program spesifik.",
                    data: null
                });
            }

            const jobdeskData = await prisma.subProgramKerja.findUnique({
                where: { id: Number(userSubProgramId) },
                include: {
                    programKerja: true
                }
            });

            if (!jobdeskData) {
                return res.status(404).json({ msg: "Data Sub Program tidak ditemukan." });
            }

            const result = {
                programKerja: {
                    id: jobdeskData.programKerja.id,
                    namaProgram: jobdeskData.programKerja.namaProgram,
                    slug: jobdeskData.programKerja.slug,
                    deskripsiProgram: jobdeskData.programKerja.deskripsi,
                },
                subProgramKerja: {
                    id: jobdeskData.id,
                    namaSubProgram: jobdeskData.namaSubProgram,
                    slug: jobdeskData.slug,
                    target: jobdeskData.target,
                    anggaran: jobdeskData.anggaran.toString()
                }
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getInboxVerifikasi: async (req, res) => {
        try {
            const { status } = req.query;
            const { role, subProgramId } = req.user;

            let whereClause = {};

            if (status) {
                whereClause.statusVerifikasi = status;
            }

            if (role === 'Kepala Dinas') {
                if (!subProgramId) {
                    return res.status(200).json({
                        status: "success",
                        data: [],
                        msg: "Anda belum ditugaskan ke Sub Program manapun."
                    });
                }
                whereClause.subProgramId = Number(subProgramId);
            }

            const data = await prisma.dataRealisasi.findMany({
                where: whereClause,
                orderBy: { tanggalInput: 'desc' },
                include: {
                    inputer: { select: { username: true, role: true, kontak: true } },
                    subProgram: {
                        select: { namaSubProgram: true, slug: true }
                    }
                }
            });

            res.json({ status: "success", data });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    verifikasiLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, catatan } = req.body;
            const { role, subProgramId } = req.user;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: { subProgram: true }
            });

            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });

            if (role === 'Kepala Dinas' && headerData.subProgramId !== subProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Bukan wewenang Anda." });
            }

            if (status === 'Disetujui') {
                const filePath = path.join('uploads', headerData.buktiDukung);

                // Cek fisik file
                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ msg: "File Excel fisik tidak ditemukan di server" });
                }

                const namaProgram = headerData.subProgram.namaSubProgram;
                const processor = getProcessor(namaProgram);

                await prisma.$transaction(async (tx) => {
                    await processor(tx, headerData.id, filePath);

                    // Update Status Header
                    await tx.dataRealisasi.update({
                        where: { id: Number(id) },
                        data: {
                            statusVerifikasi: 'Disetujui',
                            catatanRevisi: catatan,
                            diVerifikasiOleh: req.user.id,
                            tanggalVerifikasi: new Date()
                        }
                    });
                });

            } else {
                await prisma.dataRealisasi.update({
                    where: { id: Number(id) },
                    data: {
                        statusVerifikasi: 'Ditolak',
                        catatanRevisi: catatan,
                        diVerifikasiOleh: req.user.id,
                        tanggalVerifikasi: new Date()
                    }
                });
            }

            res.json({ status: "success", msg: `Laporan berhasil ${status}` });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Gagal Verifikasi", error: error.message });
        }
    },

    getDetailLaporan: async (req, res) => {
        try {
            const { id } = req.params; 
            const { role, subProgramId } = req.user;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: {
                    subProgram: { select: { namaSubProgram: true, slug: true } },
                    inputer: { select: { username: true, kontak: true } },
                    verifikator: { select: { username: true } },
                    detailBosda: true,
                    detailSpp: true,
                    detailPrakerin: true,
                    detailBeasiswa: true,
                    detailDigital: true,
                    detailVokasi: true,
                    detailCareer: true,
                    detailSeragam: true
                }
            });

            if (!headerData) {
                return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            }

            if (role === 'Kepala Dinas' && headerData.subProgramId !== subProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Ini bukan wilayah kerja Anda." });
            }

            let detailItems = [];
            let tipeLaporan = "";

            if (headerData.detailBosda.length > 0) {
                detailItems = headerData.detailBosda;
                tipeLaporan = "BOSDA";
            } else if (headerData.detailSpp.length > 0) {
                detailItems = headerData.detailSpp;
                tipeLaporan = "SPP";
            } else if (headerData.detailPrakerin.length > 0) {
                detailItems = headerData.detailPrakerin;
                tipeLaporan = "Prakerin";
            } else if (headerData.detailBeasiswa.length > 0) {
                detailItems = headerData.detailBeasiswa;
                tipeLaporan = "Beasiswa";
            } else if (headerData.detailDigital.length > 0) {
                detailItems = headerData.detailDigital;
                tipeLaporan = "Digitalisasi";
            } else if (headerData.detailVokasi.length > 0) {
                detailItems = headerData.detailVokasi;
                tipeLaporan = "Vokasi";
            } else if (headerData.detailCareer.length > 0) {
                detailItems = headerData.detailCareer;
                tipeLaporan = "Career Center";
            } else if (headerData.detailSeragam.length > 0) {
                detailItems = headerData.detailSeragam;
                tipeLaporan = "Seragam";
            }

            // 5. Format Response agar rapi di Frontend
            const result = {
                header: {
                    id: headerData.id,
                    namaLaporan: headerData.namaLaporan,
                    program: headerData.subProgram.namaSubProgram,
                    jalur: headerData.jalur || '-', // Khusus beasiswa
                    status: headerData.statusVerifikasi,
                    tanggalInput: headerData.tanggalInput,
                    tanggalVerifikasi: headerData.tanggalVerifikasi || '-',
                    pengirim: headerData.inputer.username,
                    kontakPengirim: headerData.inputer.kontak,
                    verifikator: headerData.verifikator?.username || '-',
                    catatanRevisi: headerData.catatanRevisi || '-',
                    buktiDukung: headerData.buktiDukung, // Nama file untuk download
                    tipe: tipeLaporan
                },
                // Ini adalah array detail (baris-baris Excel)
                items: detailItems 
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },
};

export default kadisController;