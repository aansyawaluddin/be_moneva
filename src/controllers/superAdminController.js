import prisma from '../utils/prisma.js';

const indikator9Controller = {

    getAllPrograms: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const programs = await prisma.programKerja.findMany({
                orderBy: { id: 'asc' },
                include: {
                    indikator9: {
                        select: { id: true }
                    }
                }
            });

            const data = programs.map(prog => ({
                id: prog.id,
                namaProgram: prog.namaProgram,
                slug: prog.slug,
                deskripsi: prog.deskripsi,
                jumlahIndikator: prog.indikator9.length
            }));

            return res.json({
                status: 'success',
                msg: 'Daftar 9 Program Kerja Berani',
                data
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: error.message });
        }
    },

    getIndikatorByProgram: async (req, res) => {
        try {
            const { programSlug } = req.params;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const program = await prisma.programKerja.findUnique({
                where: { slug: programSlug }
            });

            if (!program) {
                return res.status(404).json({
                    msg: `Program dengan slug "${programSlug}" tidak ditemukan`
                });
            }

            const indikator = await prisma.indikator9.findMany({
                where: { programKerjaId: program.id },
                orderBy: { id: 'asc' },
                include: {
                    capaian: {
                        where: { tahun },
                        select: {
                            id: true,
                            nilaiCapaian: true,
                            tanggalInput: true,
                            inputer: {
                                select: { id: true, username: true, dinas: true }
                            }
                        }
                    }
                }
            });

            const data = indikator.map(ind => {
                const capaianTahunIni = ind.capaian[0] ?? null;
                return {
                    id: ind.id,
                    namaIndikator: ind.namaIndikator,
                    satuan: ind.satuan,
                    opd: ind.opd,
                    capaian: capaianTahunIni
                        ? {
                            id: capaianTahunIni.id,
                            nilaiCapaian: capaianTahunIni.nilaiCapaian?.toString() ?? null,
                            tanggalInput: capaianTahunIni.tanggalInput,
                            diInputOleh: capaianTahunIni.inputer
                        }
                        : null
                };
            });

            return res.json({
                status: 'success',
                program: program.namaProgram,
                slug: program.slug,
                tahun,
                totalIndikator: data.length,
                data
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: error.message });
        }
    },

    upsertCapaian: async (req, res) => {
        try {
            const { programSlug, indikatorId } = req.params;
            const { tahun, nilaiCapaian } = req.body;
            const superAdminId = req.user.id;

            if (!tahun || nilaiCapaian === undefined || nilaiCapaian === null) {
                return res.status(400).json({
                    msg: 'Field tahun dan nilaiCapaian wajib diisi'
                });
            }

            const tahunInt = Number(tahun);
            if (isNaN(tahunInt) || tahunInt < 2020 || tahunInt > 2100) {
                return res.status(400).json({ msg: 'Tahun tidak valid' });
            }

            const program = await prisma.programKerja.findUnique({
                where: { slug: programSlug }
            });

            if (!program) {
                return res.status(404).json({
                    msg: `Program "${programSlug}" tidak ditemukan`
                });
            }

            const indikator = await prisma.indikator9.findFirst({
                where: {
                    id: Number(indikatorId),
                    programKerjaId: program.id
                }
            });

            if (!indikator) {
                return res.status(404).json({
                    msg: `Indikator ID ${indikatorId} tidak ditemukan di program ini`
                });
            }

            const capaian = await prisma.capaianIndikator9.upsert({
                where: {
                    indikatorId_tahun: {
                        indikatorId: indikator.id,
                        tahun: tahunInt
                    }
                },
                create: {
                    indikatorId: indikator.id,
                    tahun: tahunInt,
                    nilaiCapaian: nilaiCapaian,
                    diInputOleh: superAdminId,
                    tanggalInput: new Date()
                },
                update: {
                    nilaiCapaian: nilaiCapaian,
                    diInputOleh: superAdminId,
                    tanggalInput: new Date()
                },
                include: {
                    indikator: {
                        select: { namaIndikator: true, satuan: true, opd: true }
                    },
                    inputer: {
                        select: { id: true, username: true }
                    }
                }
            });

            return res.json({
                status: 'success',
                msg: `Capaian indikator tahun ${tahunInt} berhasil disimpan`,
                data: {
                    id: capaian.id,
                    indikator: capaian.indikator.namaIndikator,
                    satuan: capaian.indikator.satuan,
                    opd: capaian.indikator.opd,
                    tahun: capaian.tahun,
                    nilaiCapaian: capaian.nilaiCapaian?.toString(),
                    diInputOleh: capaian.inputer,
                    tanggalInput: capaian.tanggalInput
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: error.message });
        }
    },

    getRiwayatCapaian: async (req, res) => {
        try {
            const { programSlug, indikatorId } = req.params;

            const program = await prisma.programKerja.findUnique({
                where: { slug: programSlug }
            });

            if (!program) {
                return res.status(404).json({ msg: `Program "${programSlug}" tidak ditemukan` });
            }

            const indikator = await prisma.indikator9.findFirst({
                where: {
                    id: Number(indikatorId),
                    programKerjaId: program.id
                }
            });

            if (!indikator) {
                return res.status(404).json({ msg: `Indikator tidak ditemukan` });
            }

            const riwayat = await prisma.capaianIndikator9.findMany({
                where: { indikatorId: indikator.id },
                orderBy: { tahun: 'desc' },
                include: {
                    inputer: { select: { id: true, username: true, dinas: true } }
                }
            });

            return res.json({
                status: 'success',
                indikator: indikator.namaIndikator,
                satuan: indikator.satuan,
                opd: indikator.opd,
                totalTahun: riwayat.length,
                data: riwayat.map(r => ({
                    id: r.id,
                    tahun: r.tahun,
                    nilaiCapaian: r.nilaiCapaian?.toString() ?? null,
                    tanggalInput: r.tanggalInput,
                    diInputOleh: r.inputer
                }))
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: error.message });
        }
    },

    deleteCapaian: async (req, res) => {
        try {
            const { programSlug, indikatorId, tahun } = req.params;

            const program = await prisma.programKerja.findUnique({
                where: { slug: programSlug }
            });

            if (!program) {
                return res.status(404).json({ msg: `Program "${programSlug}" tidak ditemukan` });
            }

            const indikator = await prisma.indikator9.findFirst({
                where: {
                    id: Number(indikatorId),
                    programKerjaId: program.id
                }
            });

            if (!indikator) {
                return res.status(404).json({ msg: `Indikator tidak ditemukan` });
            }

            const capaian = await prisma.capaianIndikator9.findUnique({
                where: {
                    indikatorId_tahun: {
                        indikatorId: indikator.id,
                        tahun: Number(tahun)
                    }
                }
            });

            if (!capaian) {
                return res.status(404).json({
                    msg: `Capaian tahun ${tahun} untuk indikator ini tidak ditemukan`
                });
            }

            await prisma.capaianIndikator9.delete({
                where: {
                    indikatorId_tahun: {
                        indikatorId: indikator.id,
                        tahun: Number(tahun)
                    }
                }
            });

            return res.json({
                status: 'success',
                msg: `Capaian tahun ${tahun} berhasil dihapus`
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: error.message });
        }
    }
};

export default indikator9Controller;