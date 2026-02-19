import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';

const kadisController = {

    // 1. GET JOBDESK (Dashboard Utama Kadis)
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
                                    detailSeragam: true,
                                    detailIplm: true
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
                        // --- HITUNG FISIK ---
                        let jumlahFisik = 0;
                        jumlahFisik += upload.detailBeasiswa?.length || 0;
                        jumlahFisik += upload.detailDigital?.length || 0;
                        jumlahFisik += upload.detailSeragam?.length || 0;

                        // Khusus BOSDA (Jumlah Sekolah)
                        if (upload.detailBosda?.length) {
                            upload.detailBosda.forEach(item => {
                                jumlahFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                            });
                        }

                        // Khusus SPP (Total Siswa)
                        if (upload.detailSpp?.length) {
                            upload.detailSpp.forEach(item => {
                                jumlahFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                            });
                        }

                        // Khusus Prakerin (Jumlah Siswa)
                        if (upload.detailPrakerin?.length) {
                            upload.detailPrakerin.forEach(item => {
                                jumlahFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                            });
                        }

                        // Khusus Vokasi & Career (Jumlah Orang)
                        if (upload.detailVokasi?.length) {
                            upload.detailVokasi.forEach(item => {
                                jumlahFisik += Number(item.jumlahOrang) || 0;
                            });
                        }
                        if (upload.detailCareer?.length) {
                            upload.detailCareer.forEach(item => {
                                jumlahFisik += Number(item.jumlahOrang) || 0;
                            });
                        }

                        // Khusus IPLM / Literasi (Jumlah Sasaran)
                        if (upload.detailIplm?.length) {
                            upload.detailIplm.forEach(item => {
                                jumlahFisik += Number(item.jumlahOrang) || 0;
                            });
                        }

                        totalDisetujuiFisik += jumlahFisik;

                        // --- HITUNG UANG --- (Anti NaN Prisma Decimal)
                        const sumNominal = (items) => {
                            if (!items) return 0;
                            return items.reduce((acc, curr) => {
                                const nilai = curr.nominal ? Number(curr.nominal.toString()) : 0;
                                return acc + (isNaN(nilai) ? 0 : nilai);
                            }, 0);
                        };

                        const sumPrakerin = (items) => {
                            if (!items) return 0;
                            return items.reduce((acc, curr) => {
                                const uangNegeri = curr.realisasiNegeri ? Number(curr.realisasiNegeri.toString()) : 0;
                                const uangSwasta = curr.realisasiSwasta ? Number(curr.realisasiSwasta.toString()) : 0;
                                return acc + (isNaN(uangNegeri) ? 0 : uangNegeri) + (isNaN(uangSwasta) ? 0 : uangSwasta);
                            }, 0);
                        };

                        totalUangRealisasi +=
                            sumNominal(upload.detailBeasiswa) +
                            sumNominal(upload.detailBosda) +
                            sumNominal(upload.detailSpp) +
                            sumPrakerin(upload.detailPrakerin) +
                            sumNominal(upload.detailDigital) +
                            sumNominal(upload.detailVokasi) +
                            sumNominal(upload.detailCareer) +
                            sumNominal(upload.detailSeragam) +
                            sumNominal(upload.detailIplm);
                    });

                    const paguAnggaran = Number(sub.anggaran) || 0;
                    const persentaseFisik = sub.target > 0 ? (totalDisetujuiFisik / sub.target) * 100 : 0;
                    const persentaseAnggaran = paguAnggaran > 0 ? (totalUangRealisasi / paguAnggaran) * 100 : 0;

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

    // 2. INBOX VERIFIKASI 
    getInboxVerifikasi: async (req, res) => {
        try {
            const { status } = req.query;
            const { role, programKerjaId } = req.user;
            let whereClause = {};

            if (status) whereClause.statusVerifikasi = status;

            if (role === 'Kepala Dinas') {
                if (!programKerjaId) return res.status(200).json({ status: "success", data: [], msg: "Belum ada program." });
                const subPrograms = await prisma.subProgramKerja.findMany({
                    where: { programKerjaId: Number(programKerjaId) },
                    select: { id: true }
                });
                whereClause.subProgramId = { in: subPrograms.map(sp => sp.id) };
            }

            const data = await prisma.dataRealisasi.findMany({
                where: whereClause,
                orderBy: { tanggalInput: 'desc' },
                include: {
                    inputer: { select: { username: true, role: true, kontak: true } },
                    subProgram: { select: { namaSubProgram: true, slug: true } }
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
            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) {
                return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan dari Program Kerja Anda." });
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
                await tx.realisasiIplm.deleteMany({ where: { dataRealisasiId: Number(id) } });

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
            res.status(500).json({ msg: "Gagal menolak laporan", error: error.message });
        }
    },

    // 5. DETAIL LAPORAN 
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
                    detailSeragam: true,
                    detailIplm: true
                }
            });

            if (!headerData) return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) {
                return res.status(403).json({ msg: "Akses Ditolak." });
            }

            let detailItems = [];
            let tipeLaporan = "";
            const parseNominal = (val) => val ? Number(val.toString()) : 0;

            if (headerData.detailBosda?.length > 0) {
                detailItems = headerData.detailBosda.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "BOSDA";
            } else if (headerData.detailSpp?.length > 0) {
                detailItems = headerData.detailSpp.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "SPP";
            } else if (headerData.detailBeasiswa?.length > 0) {
                detailItems = headerData.detailBeasiswa.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "Beasiswa";
            } else if (headerData.detailDigital?.length > 0) {
                detailItems = headerData.detailDigital.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "Digitalisasi";
            } else if (headerData.detailVokasi?.length > 0) {
                detailItems = headerData.detailVokasi.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "Vokasi";
            } else if (headerData.detailCareer?.length > 0) {
                detailItems = headerData.detailCareer.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "Career Center";
            } else if (headerData.detailSeragam?.length > 0) {
                detailItems = headerData.detailSeragam.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "Seragam";
            } else if (headerData.detailIplm?.length > 0) {
                detailItems = headerData.detailIplm.map(item => ({ ...item, nominal: parseNominal(item.nominal) }));
                tipeLaporan = "IPLM";
            } else if (headerData.detailPrakerin?.length > 0) {
                detailItems = headerData.detailPrakerin.map(item => ({
                    ...item,
                    nominal: parseNominal(item.realisasiNegeri) + parseNominal(item.realisasiSwasta)
                }));
                tipeLaporan = "Prakerin";
            }

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
                else if (slug.includes('iplm') || slug.includes('literasi')) tipeLaporan = "IPLM";
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

    // 6. GET DATA PER SUB PROGRAM 
    getDataBySubProgram: async (req, res) => {
        try {
            const { slug } = req.params;
            const userProgramId = req.user.programKerjaId;

            const subProgram = await prisma.subProgramKerja.findUnique({
                where: { slug: slug },
                include: { programKerja: true }
            });

            if (!subProgram) return res.status(404).json({ msg: "Sub Program tidak ditemukan." });
            if (subProgram.programKerjaId !== userProgramId) return res.status(403).json({ msg: "Akses Ditolak." });

            const allReports = await prisma.dataRealisasi.findMany({
                where: { subProgramId: subProgram.id, statusVerifikasi: 'Disetujui' },
                orderBy: { tanggalVerifikasi: 'desc' },
                include: {
                    detailBeasiswa: true, detailBosda: true, detailSpp: true, detailPrakerin: true,
                    detailDigital: true, detailVokasi: true, detailCareer: true, detailSeragam: true,
                    detailIplm: true
                }
            });

            let itemsList = [];
            let totalFisik = 0;
            const parseNom = (val) => val ? Number(val.toString()) : 0;

            allReports.forEach(header => {
                const tgl = header.tanggalVerifikasi;

                // Beasiswa, Digital, Seragam (Standar)
                if (header.detailBeasiswa?.length) {
                    totalFisik += header.detailBeasiswa.length;
                    header.detailBeasiswa.forEach(item => itemsList.push({ ...item, nominal: parseNom(item.nominal) }));
                } else if (header.detailDigital?.length) {
                    totalFisik += header.detailDigital.length;
                    header.detailDigital.forEach(item => itemsList.push({ ...item, nominal: parseNom(item.nominal) }));
                } else if (header.detailSeragam?.length) {
                    totalFisik += header.detailSeragam.length;
                    header.detailSeragam.forEach(item => itemsList.push({ ...item, nominal: parseNom(item.nominal) }));
                }
                // BOSDA (Sekolah)
                else if (header.detailBosda?.length) {
                    header.detailBosda.forEach(item => {
                        totalFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                        itemsList.push({ ...item, nominal: parseNom(item.nominal) });
                    });
                }
                // SPP (Siswa)
                else if (header.detailSpp?.length) {
                    header.detailSpp.forEach(item => {
                        totalFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                        itemsList.push({ ...item, nominal: parseNom(item.nominal) });
                    });
                }
                // Prakerin (Siswa)
                else if (header.detailPrakerin?.length) {
                    header.detailPrakerin.forEach(item => {
                        totalFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                        const totalNominal = parseNom(item.realisasiNegeri) + parseNom(item.realisasiSwasta);
                        itemsList.push({ ...item, nominal: totalNominal });
                    });
                }
                // Vokasi & Career (Orang)
                else if (header.detailVokasi?.length) {
                    header.detailVokasi.forEach(item => {
                        totalFisik += Number(item.jumlahOrang) || 0;
                        itemsList.push({ ...item, nominal: parseNom(item.nominal) });
                    });
                } else if (header.detailCareer?.length) {
                    header.detailCareer.forEach(item => {
                        totalFisik += Number(item.jumlahOrang) || 0;
                        itemsList.push({ ...item, nominal: parseNom(item.nominal) });
                    });
                }
                // IPLM / Literasi (Sasaran)
                else if (header.detailIplm?.length) {
                    header.detailIplm.forEach(item => {
                        totalFisik += Number(item.jumlahOrang) || 0;
                        itemsList.push({ ...item, nominal: parseNom(item.nominal) });
                    });
                }
            });

            res.json({
                status: "success",
                program: subProgram.programKerja.namaProgram,
                subProgram: subProgram.namaSubProgram,
                target: subProgram.target,
                anggaran: subProgram.anggaran.toString(),
                totalRealisasi: totalFisik,
                data: itemsList
            });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
};

export default kadisController;