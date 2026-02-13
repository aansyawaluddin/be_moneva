import prisma from '../../utils/prisma.js';

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

};

export default gubernurController;