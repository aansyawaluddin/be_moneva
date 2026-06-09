import prisma from '../../utils/prisma.js';

const gubernurController = {

    // =========================================
    // PROGRAM KERJA
    // =========================================

    createProgram: async (req, res) => {
        try {
            const { namaProgram, deskripsi } = req.body;
            const slug = namaProgram.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            const newProgram = await prisma.programKerja.create({
                data: { namaProgram, deskripsi, slug }
            });
            res.status(201).json({ msg: "Program berhasil dibuat", data: newProgram });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getAllPrograms: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const programs = await prisma.programKerja.findMany({
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

            const result = programs.map(p => ({
                id: p.id,
                namaProgram: p.namaProgram,
                slug: p.slug,
                deskripsi: p.deskripsi,
                tahun,
                subProgram: p.subProgram.map(sub => {
                    const targetData = sub.targetTahunan?.[0];
                    return {
                        id: sub.id,
                        namaSubProgram: sub.namaSubProgram,
                        slug: sub.slug,
                        target: targetData?.target ?? 0,
                        anggaran: targetData?.anggaran?.toString() ?? '0',
                    };
                })
            }));

            res.json({ status: "success", tahun, data: result });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getProgramBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const program = await prisma.programKerja.findUnique({
                where: { slug },
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

            if (!program) return res.status(404).json({ msg: "Program tidak ditemukan." });

            const result = {
                id: program.id,
                namaProgram: program.namaProgram,
                slug: program.slug,
                deskripsi: program.deskripsi,
                tahun,
                subProgram: program.subProgram.map(sub => {
                    const targetData = sub.targetTahunan?.[0];
                    return {
                        id: sub.id,
                        namaSubProgram: sub.namaSubProgram,
                        slug: sub.slug,
                        target: targetData?.target ?? 0,
                        anggaran: targetData?.anggaran?.toString() ?? '0',
                    };
                })
            };

            res.json({ status: "success", data: result });
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
            res.status(500).json({ msg: "Gagal hapus (mungkin ada data terkait)", error: error.message });
        }
    },

    // =========================================
    // SUB PROGRAM KERJA
    // =========================================

    createSubProgram: async (req, res) => {
        try {
            const { programKerjaId, namaSubProgram, tahun, target, anggaran } = req.body;

            if (!programKerjaId || !namaSubProgram) {
                return res.status(400).json({ msg: "programKerjaId dan namaSubProgram wajib diisi." });
            }

            const tahunAnggaran = Number(tahun) || new Date().getFullYear();
            const slug = namaSubProgram.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

            // Buat sub program
            const newSub = await prisma.subProgramKerja.create({
                data: {
                    programKerjaId: Number(programKerjaId),
                    namaSubProgram,
                    slug
                }
            });

            // Buat target tahunan sekaligus
            const newTarget = await prisma.subProgramTarget.create({
                data: {
                    subProgramId: newSub.id,
                    tahun: tahunAnggaran,
                    target: Number(target) || 0,
                    anggaran: BigInt(anggaran || 0)
                }
            });

            res.status(201).json({
                msg: "Sub Program dan target tahunan berhasil dibuat",
                data: {
                    ...newSub,
                    targetTahunan: { ...newTarget, anggaran: newTarget.anggaran.toString() }
                }
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getAllSubPrograms: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const data = await prisma.subProgramKerja.findMany({
                include: {
                    programKerja: true,
                    targetTahunan: {
                        where: { tahun }
                    }
                }
            });

            const result = data.map(sub => {
                const targetData = sub.targetTahunan?.[0];
                return {
                    id: sub.id,
                    namaSubProgram: sub.namaSubProgram,
                    slug: sub.slug,
                    programKerja: sub.programKerja,
                    tahun,
                    target: targetData?.target ?? 0,
                    anggaran: targetData?.anggaran?.toString() ?? '0',
                };
            });

            res.json({ status: "success", tahun, data: result });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    updateSubProgram: async (req, res) => {
        try {
            const { id } = req.params;
            const { namaSubProgram } = req.body;

            const updated = await prisma.subProgramKerja.update({
                where: { id: Number(id) },
                data: { namaSubProgram }
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

    // =========================================
    // TARGET TAHUNAN (CRUD terpisah)
    // =========================================

    // Buat atau update target untuk tahun tertentu
    upsertTarget: async (req, res) => {
        try {
            const { subProgramId, tahun, target, anggaran, keterangan } = req.body;

            if (!subProgramId || !tahun) {
                return res.status(400).json({ msg: "subProgramId dan tahun wajib diisi." });
            }

            const result = await prisma.subProgramTarget.upsert({
                where: {
                    subProgramId_tahun: {
                        subProgramId: Number(subProgramId),
                        tahun: Number(tahun)
                    }
                },
                update: {
                    target: Number(target) || 0,
                    anggaran: BigInt(anggaran || 0),
                    keterangan: keterangan || null
                },
                create: {
                    subProgramId: Number(subProgramId),
                    tahun: Number(tahun),
                    target: Number(target) || 0,
                    anggaran: BigInt(anggaran || 0),
                    keterangan: keterangan || null
                }
            });

            res.json({
                msg: `Target tahun ${tahun} berhasil disimpan`,
                data: { ...result, anggaran: result.anggaran.toString() }
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // Lihat semua target tahunan untuk satu sub-program
    getTargetBySubProgram: async (req, res) => {
        try {
            const { subProgramId } = req.params;

            const targets = await prisma.subProgramTarget.findMany({
                where: { subProgramId: Number(subProgramId) },
                orderBy: { tahun: 'desc' }
            });

            res.json({
                status: "success",
                data: targets.map(t => ({ ...t, anggaran: t.anggaran.toString() }))
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    deleteTarget: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.subProgramTarget.delete({ where: { id: Number(id) } });
            res.json({ msg: "Target tahunan dihapus" });
        } catch (error) {
            res.status(500).json({ msg: "Gagal hapus target", error: error.message });
        }
    }
};

export default gubernurController;