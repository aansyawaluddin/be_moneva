import prisma from '../../utils/prisma.js';

const programKerjaController = {

    getAllPrograms: async (req, res) => {
        try {
            // 1. Ambil data dari database
            const programs = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        orderBy: { id: 'asc' } 
                    }
                },
                orderBy: { id: 'asc' }
            });

            const formattedData = programs.map(prog => {
                
                const totalAnggaranProgram = prog.subProgram.reduce((acc, curr) => {
                    return acc + (Number(curr.anggaran) || 0);
                }, 0);

                return {
                    id: prog.id,
                    namaProgram: prog.namaProgram,
                    slug: prog.slug,
                    deskripsi: prog.deskripsi,
                    totalSubProgram: prog.subProgram.length,
                    totalAnggaran: totalAnggaranProgram.toString(),
                    
                    subPrograms: prog.subProgram.map(sub => ({
                        id: sub.id,
                        namaSubProgram: sub.namaSubProgram,
                        slug: sub.slug,
                        target: sub.target,
                        anggaran: sub.anggaran.toString() 
                    }))
                };
            });

            res.json({
                status: "success",
                msg: "Daftar Seluruh Program & Sub Program Kerja",
                data: formattedData
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