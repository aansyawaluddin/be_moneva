import prisma from '../utils/prisma.js';

const gubernurController = {
    // Program Kerja
    createProgram: async (req, res) => {
        try {
            const { namaProgram, deskripsi } = req.body;
            const newProgram = await prisma.programKerja.create({
                data: { namaProgram, deskripsi }
            });
            res.status(201).json({ msg: "Program berhasil dibuat", data: newProgram });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getAllPrograms: async (req, res) => {
        try {
            const programs = await prisma.programKerja.findMany({
                include: { subProgram: true }
            });
            res.json(programs);
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    updateProgram: async (req, res) => {
        try {
            const { id } = req.params;
            const { namaProgram, deskripsi } = req.body;
            const updated = await prisma.programKerja.update({
                where: { id: Number(id) },
                data: { namaProgram, deskripsi }
            });
            res.json({ msg: "Program diupdate", data: updated });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    deleteProgram: async (req, res) => {
        try {
            await prisma.programKerja.delete({ where: { id: Number(req.params.id) } });
            res.json({ msg: "Program dihapus" });
        } catch (error) {
            res.status(500).json({ msg: "Gagal hapus (Mungkin ada data terkait)", error: error.message });
        }
    },

    // Sub Program
    createSubProgram: async (req, res) => {
        try {
            const { programKerjaId, namaSubProgram, target } = req.body;
            const newSub = await prisma.subProgramKerja.create({
                data: {
                    programKerjaId: Number(programKerjaId),
                    namaSubProgram,
                    target: Number(target)
                }
            });
            res.status(201).json({ msg: "Sub Program dibuat", data: newSub });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getAllSubPrograms: async (req, res) => {
        try {
            const data = await prisma.subProgramKerja.findMany({
                include: { programKerja: true, kategori: true }
            });
            res.json(data);
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    updateSubProgram: async (req, res) => {
        try {
            const { id } = req.params;
            const { namaSubProgram, target } = req.body;
            const updated = await prisma.subProgramKerja.update({
                where: { id: Number(id) },
                data: { namaSubProgram, target: Number(target) }
            });
            res.json({ msg: "Sub Program diupdate", data: updated });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    deleteSubProgram: async (req, res) => {
        try {
            await prisma.subProgramKerja.delete({ where: { id: Number(req.params.id) } });
            res.json({ msg: "Sub Program dihapus" });
        } catch (error) {
            res.status(500).json({ msg: "Gagal hapus", error: error.message });
        }
    },

    // Kategori
    createKategori: async (req, res) => {
        try {
            const { subProgramId, namaKategori } = req.body;
            const newKat = await prisma.kategoriSubProgram.create({
                data: { subProgramId: Number(subProgramId), namaKategori }
            });
            res.status(201).json({ msg: "Kategori dibuat", data: newKat });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    deleteKategori: async (req, res) => {
        try {
            await prisma.kategoriSubProgram.delete({ where: { id: Number(req.params.id) } });
            res.json({ msg: "Kategori dihapus" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // Monitoring
    getMonitoringStats: async (req, res) => {
        try {
            const allData = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            kategori: {
                                include: {
                                    dataRealisasi: {
                                        include: {
                                            detailBeasiswa: true,
                                            detailBosda: true 
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const monitoringData = allData.map(program => {
                return {
                    id: program.id,
                    namaProgram: program.namaProgram,
                    subPrograms: program.subProgram.map(sub => {

                        let totalDisetujui = 0;
                        let totalMenunggu = 0;

                        sub.kategori.forEach(kat => {
                            kat.dataRealisasi.forEach(upload => {
                                const jumlahData = upload.detailBeasiswa.length + upload.detailBosda.length;

                                if (upload.statusVerifikasi === 'Disetujui') {
                                    totalDisetujui += jumlahData;
                                } else if (upload.statusVerifikasi === 'Menunggu') {
                                    totalMenunggu += jumlahData;
                                }
                            });
                        });

                        // Hitung Persentase
                        let rawPersentase = sub.target > 0
                            ? (totalDisetujui / sub.target) * 100
                            : 0;

                        let stringPersentase = rawPersentase.toFixed(2);

                        return {
                            id: sub.id,
                            namaSubProgram: sub.namaSubProgram,
                            target: sub.target,
                            realisasi: totalDisetujui,
                            pending: totalMenunggu,
                            capaian: `${stringPersentase}%`,
                            statusCapaian: Number(rawPersentase) >= 100 ? 'Tuntas' : 'Berjalan'
                        };
                    })
                };
            });

            res.json({
                status: "success",
                msg: "Data Monitoring Realisasi Program",
                data: monitoringData
            });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getAllRealisasiDetail: async (req, res) => {
        try {
            const recipients = await prisma.realisasiBeasiswa.findMany({
                where: {
                    header: {
                        statusVerifikasi: 'Disetujui'
                    }
                },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: {
                                        include: { programKerja: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = recipients.map(item => ({
                id: item.id,
                namaPenerima: item.namaPenerima,
                kampus: item.institusiTujuan,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
                tanggalCair: item.header.tanggalVerifikasi
            }));

            res.json({ status: "success", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },
};

export default gubernurController;