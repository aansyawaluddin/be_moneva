import prisma from '../../utils/prisma.js';

const programKerjaController = {

    getAllPrograms: async (req, res) => {
        try {
            const programs = await prisma.programKerja.findMany({
                orderBy: { id: 'asc' }
            });

            res.json({
                status: "success",
                msg: "Daftar Program Kerja",
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
            const prog = await prisma.programKerja.findUnique({
                where: { slug: slug },
                include: {
                    subProgram: {
                        orderBy: { id: 'asc' }
                    }
                }
            });

            if (!prog) {
                return res.status(404).json({ msg: "Program tidak ditemukan" });
            }

            const subProgramsOnly = prog.subProgram.map(sub => ({
                id: sub.id,
                namaSubProgram: sub.namaSubProgram,
                slug: sub.slug,
                target: sub.target,
                anggaran: sub.anggaran.toString()
            }));
            res.json({
                status: "success",
                id: prog.id,
                program: prog.namaProgram,
                slug: prog.slug,
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
            const prog = await prisma.programKerja.findUnique({
                where: { id: Number(id) },
                include: { subProgram: true }
            });

            if (!prog) return res.status(404).json({ msg: "Program tidak ditemukan" });

            const result = {
                ...prog,
                subProgram: prog.subProgram.map(sub => ({
                    ...sub,
                    anggaran: sub.anggaran.toString()
                }))
            };

            res.json({ status: "success", data: result });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
};

export default programKerjaController;