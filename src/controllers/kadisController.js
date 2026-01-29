import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { getProcessor } from '../services/processors/index.js';

const kadisController = {

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

                whereClause.kategori = {
                    subProgramId: Number(subProgramId)
                };
            }
            const data = await prisma.dataRealisasi.findMany({
                where: whereClause,
                orderBy: { tanggalInput: 'desc' },
                include: {
                    inputer: { select: { username: true, role: true, kontak: true } },
                    kategori: { include: { subProgram: true } },
                    detailBeasiswa: true
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
                include: { kategori: { include: { subProgram: true } } }
            });

            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });

            if (role === 'Kepala Dinas' && headerData.kategori.subProgramId !== subProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Bukan wewenang Anda." });
            }

            if (status === 'Disetujui') {
                const filePath = path.join('uploads', headerData.buktiDukung);
                if (!fs.existsSync(filePath)) return res.status(404).json({ msg: "File Excel hilang" });

                const namaProgram = headerData.kategori.subProgram.namaSubProgram;
                const processor = getProcessor(namaProgram);

                await prisma.$transaction(async (tx) => {

                    await processor(tx, headerData.id, filePath);

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
    }
};

export default kadisController;