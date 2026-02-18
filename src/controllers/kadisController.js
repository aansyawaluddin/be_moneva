import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { getProcessor } from '../services/processors/index.js';

const kadisController = {

    // GET JOBDESK
    getJobdesk: async (req, res) => {
        try {
            const userProgramId = req.user.programKerjaId;

            if (!userProgramId) {
                return res.status(200).json({
                    status: "success",
                    msg: "Anda belum ditugaskan ke Program Kerja manapun.",
                    data: null
                });
            }

            const programData = await prisma.programKerja.findUnique({
                where: { id: Number(userProgramId) },
                include: {
                    subProgram: {
                        orderBy: { id: 'asc' },
                        include: {
                            dataRealisasi: {
                                where: { statusVerifikasi: 'Disetujui' },
                                include: {
                                    detailBeasiswa: true,
                                    detailBosda: true,
                                    detailSpp: true,
                                    detailPrakerin: true,
                                    detailDigital: true,
                                    detailVokasi: true,
                                    detailCareer: true,
                                    detailSeragam: true
                                }
                            }
                        }
                    }
                }
            });

            if (!programData) {
                return res.status(404).json({ msg: "Data Program Kerja tidak ditemukan." });
            }

            const result = {
                programKerja: {
                    id: programData.id,
                    namaProgram: programData.namaProgram,
                    slug: programData.slug,
                    deskripsiProgram: programData.deskripsi,
                },
                subPrograms: programData.subProgram.map(sub => {
                    let totalDisetujuiFisik = 0;
                    let totalUangRealisasi = 0;

                    sub.dataRealisasi.forEach(upload => {
                        const jumlahBaris =
                            (upload.detailBeasiswa?.length || 0) +
                            (upload.detailBosda?.length || 0) +
                            (upload.detailSpp?.length || 0) +
                            (upload.detailPrakerin?.length || 0) +
                            (upload.detailDigital?.length || 0) +
                            (upload.detailVokasi?.length || 0) +
                            (upload.detailCareer?.length || 0) +
                            (upload.detailSeragam?.length || 0);

                        totalDisetujuiFisik += jumlahBaris;

                        const sumNominal = (items) => {
                            if (!items) return 0;
                            return items.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
                        };

                        totalUangRealisasi +=
                            sumNominal(upload.detailBeasiswa) +
                            sumNominal(upload.detailBosda) +
                            sumNominal(upload.detailSpp) +
                            sumNominal(upload.detailPrakerin) +
                            sumNominal(upload.detailDigital) +
                            sumNominal(upload.detailVokasi) +
                            sumNominal(upload.detailCareer) +
                            sumNominal(upload.detailSeragam);
                    });

                    const paguAnggaran = Number(sub.anggaran) || 0;

                    const persentaseFisik = sub.target > 0
                        ? (totalDisetujuiFisik / sub.target) * 100
                        : 0;

                    const persentaseAnggaran = paguAnggaran > 0
                        ? (totalUangRealisasi / paguAnggaran) * 100
                        : 0;

                    return {
                        id: sub.id,
                        namaSubProgram: sub.namaSubProgram,
                        slug: sub.slug,
                        target: sub.target,
                        anggaran: sub.anggaran.toString(),
                        realisasiTarget: totalDisetujuiFisik,
                        persentaseTarget: `${persentaseFisik.toFixed(2)}%`,
                        realisasiAnggaran: totalUangRealisasi.toString(),
                        persentaseAnggaran: `${persentaseAnggaran.toFixed(2)}%`
                    };
                })
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    // INBOX VERIFIKASI 
    getInboxVerifikasi: async (req, res) => {
        try {
            const { status } = req.query;
            const { role, programKerjaId } = req.user;

            let whereClause = {};

            if (status) {
                whereClause.statusVerifikasi = status;
            }
            if (role === 'Kepala Dinas') {
                if (!programKerjaId) {
                    return res.status(200).json({ status: "success", data: [], msg: "Belum ada program." });
                }

                const subPrograms = await prisma.subProgramKerja.findMany({
                    where: { programKerjaId: Number(programKerjaId) },
                    select: { id: true }
                });

                const subProgramIds = subPrograms.map(sp => sp.id);

                whereClause.subProgramId = { in: subProgramIds };
            }

            const data = await prisma.dataRealisasi.findMany({
                where: whereClause,
                orderBy: { tanggalInput: 'desc' },
                include: {
                    inputer: { select: { username: true, role: true, kontak: true } },
                    subProgram: {
                        select: { namaSubProgram: true, slug: true }
                    }
                }
            });

            res.json({ status: "success", data });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // 3. APPROVE LAPORAN
    approveLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, programKerjaId } = req.user;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: { subProgram: true }
            });

            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });

            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) {
                return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan dari Program Kerja Anda." });
            }

            if (headerData.statusVerifikasi === 'Disetujui') {
                return res.status(400).json({ msg: "Laporan ini sudah disetujui sebelumnya." });
            }

            await prisma.dataRealisasi.update({
                where: { id: Number(id) },
                data: {
                    statusVerifikasi: 'Disetujui',
                    catatanRevisi: null,
                    diVerifikasiOleh: req.user.id,
                    tanggalVerifikasi: new Date()
                }
            });

            res.json({ status: "success", msg: "Laporan Berhasil Disetujui (ACC)" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Gagal menyetujui laporan", error: error.message });
        }
    },

    // 4. REJECT LAPORAN
    rejectLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { catatan } = req.body;
            const { role, programKerjaId } = req.user;

            if (!catatan) return res.status(400).json({ msg: "Catatan penolakan wajib diisi!" });

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: { subProgram: true }
            });

            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });

            if (role === 'Kepala Dinas') {
                if (headerData.subProgram.programKerjaId !== programKerjaId) {
                    return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan dari Program Kerja Anda." });
                }
            }

            if (headerData.statusVerifikasi === 'Ditolak') {
                return res.status(400).json({ msg: "Laporan ini sudah ditolak sebelumnya." });
            }

            await prisma.$transaction(async (tx) => {
                await tx.realisasiBeasiswa.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiBosda.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiSpp.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiPrakerin.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiDigital.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiVokasi.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiCareerCenter.deleteMany({ where: { dataRealisasiId: Number(id) } });
                await tx.realisasiSeragam.deleteMany({ where: { dataRealisasiId: Number(id) } });

                await tx.dataRealisasi.update({
                    where: { id: Number(id) },
                    data: {
                        statusVerifikasi: 'Ditolak',
                        catatanRevisi: catatan,
                        diVerifikasiOleh: req.user.id,
                        tanggalVerifikasi: null
                    }
                });
            });

            res.json({ status: "success", msg: "Laporan Berhasil Ditolak" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Gagal menolak laporan", error: error.message });
        }
    },

    // DETAIL LAPORAN 
    getDetailLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, programKerjaId } = req.user;

            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: {
                    subProgram: { select: { namaSubProgram: true, slug: true, programKerjaId: true } },
                    inputer: { select: { username: true, kontak: true } },
                    verifikator: { select: { username: true } },
                    detailBosda: true,
                    detailSpp: true,
                    detailPrakerin: true,
                    detailBeasiswa: true,
                    detailDigital: true,
                    detailVokasi: true,
                    detailCareer: true,
                    detailSeragam: true
                }
            });

            if (!headerData) {
                return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            }

            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) {
                return res.status(403).json({ msg: "Akses Ditolak: Ini bukan wilayah kerja Anda." });
            }

            let detailItems = [];
            let tipeLaporan = "";

            if (headerData.detailBosda.length > 0) { detailItems = headerData.detailBosda; tipeLaporan = "BOSDA"; }
            else if (headerData.detailSpp.length > 0) { detailItems = headerData.detailSpp; tipeLaporan = "SPP"; }
            else if (headerData.detailPrakerin.length > 0) { detailItems = headerData.detailPrakerin; tipeLaporan = "Prakerin"; }
            else if (headerData.detailBeasiswa.length > 0) { detailItems = headerData.detailBeasiswa; tipeLaporan = "Beasiswa"; }
            else if (headerData.detailDigital.length > 0) { detailItems = headerData.detailDigital; tipeLaporan = "Digitalisasi"; }
            else if (headerData.detailVokasi.length > 0) { detailItems = headerData.detailVokasi; tipeLaporan = "Vokasi"; }
            else if (headerData.detailCareer.length > 0) { detailItems = headerData.detailCareer; tipeLaporan = "Career Center"; }
            else if (headerData.detailSeragam.length > 0) { detailItems = headerData.detailSeragam; tipeLaporan = "Seragam"; }


            if (tipeLaporan === "") {
                const slug = headerData.subProgram.slug.toLowerCase();
                if (slug.includes('bosda')) tipeLaporan = "BOSDA";
                else if (slug.includes('spp')) tipeLaporan = "SPP";
                else if (slug.includes('prakerin')) tipeLaporan = "Prakerin";
                else if (slug.includes('beasiswa')) tipeLaporan = "Beasiswa";
                else if (slug.includes('digital')) tipeLaporan = "Digitalisasi";
                else if (slug.includes('vokasi')) tipeLaporan = "Vokasi";
                else if (slug.includes('career')) tipeLaporan = "Career Center";
                else if (slug.includes('seragam')) tipeLaporan = "Seragam";
                else tipeLaporan = "Umum";
            }

            const result = {
                header: {
                    id: headerData.id,
                    namaLaporan: headerData.namaLaporan,
                    program: headerData.subProgram.namaSubProgram,
                    jalur: headerData.jalur || '-',
                    status: headerData.statusVerifikasi,
                    tanggalInput: headerData.tanggalInput,
                    tanggalVerifikasi: headerData.tanggalVerifikasi || '-',
                    pengirim: headerData.inputer.username,
                    kontakPengirim: headerData.inputer.kontak,
                    verifikator: headerData.verifikator?.username || '-',
                    catatanRevisi: headerData.catatanRevisi || '-',
                    buktiDukung: headerData.buktiDukung,
                    tipe: tipeLaporan
                },
                items: detailItems
            };

            res.json({ status: "success", data: result });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // GET DATA PER SUB PROGRAM
    getDataBySubProgram: async (req, res) => {
        try {
            const { slug } = req.params;
            const userProgramId = req.user.programKerjaId;

            const subProgram = await prisma.subProgramKerja.findUnique({
                where: { slug: slug },
                include: { programKerja: true }
            });

            if (!subProgram) {
                return res.status(404).json({ msg: "Sub Program tidak ditemukan." });
            }

            if (subProgram.programKerjaId !== userProgramId) {
                return res.status(403).json({ msg: "Akses Ditolak: Sub Program ini bukan wilayah kerja Anda." });
            }

            const allReports = await prisma.dataRealisasi.findMany({
                where: {
                    subProgramId: subProgram.id,
                    statusVerifikasi: 'Disetujui'
                },
                orderBy: { tanggalVerifikasi: 'desc' },
                include: {
                    detailBeasiswa: true,
                    detailBosda: true,
                    detailSpp: true,
                    detailPrakerin: true,
                    detailDigital: true,
                    detailVokasi: true,
                    detailCareer: true,
                    detailSeragam: true
                }
            });

            let itemsList = [];

            allReports.forEach(header => {
                const tgl = header.tanggalVerifikasi;

                if (header.detailBeasiswa?.length) {
                    header.detailBeasiswa.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailBosda?.length) {
                    header.detailBosda.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailSpp?.length) {
                    header.detailSpp.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailPrakerin?.length) {
                    header.detailPrakerin.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailDigital?.length) {
                    header.detailDigital.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailVokasi?.length) {
                    header.detailVokasi.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailCareer?.length) {
                    header.detailCareer.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                } else if (header.detailSeragam?.length) {
                    header.detailSeragam.forEach(item => itemsList.push({ ...item, tanggalCair: tgl }));
                }
            });

            res.json({
                status: "success",
                program: subProgram.programKerja.namaProgram,
                subProgram: subProgram.namaSubProgram,
                target: subProgram.target,
                anggaran: subProgram.anggaran.toString(),
                totalRealisasi: itemsList.length,
                data: itemsList
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default kadisController;