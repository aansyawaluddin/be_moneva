import prisma from '../utils/prisma.js';
import fs from 'fs';

const staffController = {

    getJobdesk: async (req, res) => {
        try {
            const userSubProgramId = req.user.subProgramId;

            if (!userSubProgramId) {
                return res.status(400).json({ msg: "Anda belum ditugaskan ke Sub Program manapun." });
            }

            const jobdeskData = await prisma.subProgramKerja.findUnique({
                where: { id: Number(userSubProgramId) },
                include: {
                    programKerja: true,
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
                    target: jobdeskData.target
                },
                isBeasiswa: jobdeskData.slug.includes('beasiswa')
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    uploadLaporan: async (req, res) => {
        try {
            const file = req.file;
            const { jalur, namaLaporan } = req.body;
            const userSubProgramId = req.user.subProgramId;

            if (!file) return res.status(400).json({ msg: "File Excel wajib diupload" });

            if (!userSubProgramId) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(403).json({ msg: "Anda belum ditugaskan ke Sub Program manapun. Hubungi Administrator." });
            }

            const header = await prisma.dataRealisasi.create({
                data: {
                    subProgramId: Number(userSubProgramId),
                    namaLaporan: namaLaporan,
                    jalur: jalur || null,
                    diInputOleh: req.user.id,
                    statusVerifikasi: 'Menunggu',
                    tanggalInput: new Date(),
                    buktiDukung: file.filename
                }
            });

            res.status(201).json({
                status: "success",
                msg: "Laporan berhasil diupload. Menunggu verifikasi atasan.",
                data: header
            });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            console.error(error);
            res.status(500).json({ msg: "Gagal upload", error: error.message });
        }
    },

    getMyUploads: async (req, res) => {
        try {
            const data = await prisma.dataRealisasi.findMany({
                where: { diInputOleh: req.user.id },
                orderBy: { tanggalInput: 'desc' },
                include: {
                    subProgram: { select: { namaSubProgram: true } },
                    verifikator: { select: { username: true } }
                }
            });
            res.json({ status: "success", data });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getDetailLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: {
                    subProgram: { select: { namaSubProgram: true } },
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

            if (headerData.diInputOleh !== userId) {
                return res.status(403).json({ msg: "Anda tidak memiliki akses ke laporan ini." });
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