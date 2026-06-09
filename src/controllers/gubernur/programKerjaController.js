import prisma from '../../utils/prisma.js';

const programKerjaController = {

    getAllPrograms: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const programs = await prisma.programKerja.findMany({
                orderBy: { id: 'asc' }
            });

            res.json({
                status: "success",
                msg: "Daftar Program Kerja",
                tahun,
                data: programs
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    getProgramBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const prog = await prisma.programKerja.findUnique({
                where: { slug },
                include: {
                    subProgram: {
                        orderBy: { id: 'asc' },
                        include: {
                            targetTahunan: {
                                where: { tahun }
                            }
                        }
                    }
                }
            });

            if (!prog) {
                return res.status(404).json({ msg: "Program tidak ditemukan" });
            }

            const subProgramsOnly = prog.subProgram.map(sub => {
                const targetData = sub.targetTahunan?.[0];
                return {
                    id: sub.id,
                    namaSubProgram: sub.namaSubProgram,
                    slug: sub.slug,
                    target: targetData?.target ?? 0,
                    anggaran: targetData?.anggaran?.toString() ?? '0'
                };
            });

            res.json({
                status: "success",
                id: prog.id,
                program: prog.namaProgram,
                slug: prog.slug,
                tahun,
                data: subProgramsOnly
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    getProgramById: async (req, res) => {
        try {
            const { id } = req.params;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const prog = await prisma.programKerja.findUnique({
                where: { id: Number(id) },
                include: {
                    subProgram: {
                        include: {
                            targetTahunan: {
                                where: { tahun }
                            }
                        }
                    }
                }
            });

            if (!prog) return res.status(404).json({ msg: "Program tidak ditemukan" });

            const result = {
                id: prog.id,
                namaProgram: prog.namaProgram,
                slug: prog.slug,
                deskripsi: prog.deskripsi,
                tahun,
                subProgram: prog.subProgram.map(sub => {
                    const targetData = sub.targetTahunan?.[0];
                    return {
                        id: sub.id,
                        namaSubProgram: sub.namaSubProgram,
                        slug: sub.slug,
                        target: targetData?.target ?? 0,
                        anggaran: targetData?.anggaran?.toString() ?? '0'
                    };
                })
            };

            res.json({ status: "success", data: result });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
};

export default programKerjaController;