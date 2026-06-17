import prisma from '../../utils/prisma.js';

const indikator9Controller = {

    getAllPrograms: async (req, res) => {
        try {
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
                            tanggalInput: true
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
                            tanggalInput: capaianTahunIni.tanggalInput
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
    }
};

export default indikator9Controller;