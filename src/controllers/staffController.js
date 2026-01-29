import prisma from '../utils/prisma.js';
import fs from 'fs';

const staffController = {

    getMyKategoriOptions: async (req, res) => {
        try {
            const userSubProgramId = req.user.subProgramId;

            if (!userSubProgramId) {
                return res.status(400).json({ msg: "Anda belum ditugaskan ke Sub Program manapun." });
            }

            const options = await prisma.kategoriSubProgram.findMany({
                where: { subProgramId: userSubProgramId }
            });

            res.json({ status: "success", data: options });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // Upload Laporan
    uploadLaporan: async (req, res) => {
        try {
            const file = req.file;
            const { kategoriId } = req.body;

            if (!file) return res.status(400).json({ msg: "File Excel wajib diupload" });
            if (!kategoriId) {
                fs.unlinkSync(file.path);
                return res.status(400).json({ msg: "Kategori ID wajib diisi" });
            }

            const kategoriCheck = await prisma.kategoriSubProgram.findFirst({
                where: { 
                    id: Number(kategoriId),
                    subProgramId: req.user.subProgramId
                }
            });

            if (!kategoriCheck && req.user.role === 'Staff') { 
                fs.unlinkSync(file.path);
                return res.status(403).json({ msg: "Anda tidak berhak mengupload untuk kategori ini." });
            }

            const header = await prisma.dataRealisasi.create({
                data: {
                    kategoriId: Number(kategoriId),
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
            res.status(500).json({ msg: "Gagal upload", error: error.message });
        }
    },

    getMyUploads: async (req, res) => {
        try {
            const data = await prisma.dataRealisasi.findMany({
                where: { diInputOleh: req.user.id },
                orderBy: { tanggalInput: 'desc' },
                include: { kategori: true, verifikator: { select: { username: true } } }
            });
            res.json({ status: "success", data });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
};

export default staffController;