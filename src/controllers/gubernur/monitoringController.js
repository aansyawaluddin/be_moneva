import prisma from '../../utils/prisma.js';

const monitoringController = {

    // 1. STATISTIK DASHBOARD (UMUM)
    getMonitoringStats: async (req, res) => {
        try {
            const allData = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            dataRealisasi: {
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

            const monitoringData = allData.map(program => {
                return {
                    id: program.id,
                    "Nama Program": program.namaProgram,
                    "Daftar Sub Program": program.subProgram.map(sub => {
                        let totalDisetujuiFisik = 0;
                        let totalMenungguFisik = 0;
                        let totalUangRealisasi = 0;

                        sub.dataRealisasi.forEach(upload => {
                            let jumlahFisik = 0;

                            jumlahFisik += upload.detailBeasiswa?.length || 0;
                            jumlahFisik += upload.detailDigital?.length || 0;
                            jumlahFisik += upload.detailCareer?.length || 0;
                            jumlahFisik += upload.detailSeragam?.length || 0;

                            if (upload.detailBosda && upload.detailBosda.length > 0) {
                                upload.detailBosda.forEach(item => {
                                    jumlahFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                                });
                            }

                            if (upload.detailSpp && upload.detailSpp.length > 0) {
                                upload.detailSpp.forEach(item => {
                                    jumlahFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                                });
                            }

                            if (upload.detailPrakerin && upload.detailPrakerin.length > 0) {
                                upload.detailPrakerin.forEach(item => {
                                    jumlahFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                                });
                            }

                            if (upload.detailVokasi && upload.detailVokasi.length > 0) {
                                upload.detailVokasi.forEach(item => {
                                    jumlahFisik += Number(item.jumlahOrang) || 0;
                                });
                            }

                            if (upload.detailIplm && upload.detailIplm.length > 0) {
                                upload.detailIplm.forEach(item => {
                                    jumlahFisik += Number(item.jumlahOrang) || 0;
                                });
                            }

                            let uangLaporan = 0;
                            const sumNominal = (items) => {
                                if (!items) return;
                                items.forEach(item => {
                                    const nilai = item.nominal ? Number(item.nominal.toString()) : 0;
                                    uangLaporan += (isNaN(nilai) ? 0 : nilai);
                                });
                            };

                            sumNominal(upload.detailBeasiswa);
                            sumNominal(upload.detailBosda);
                            sumNominal(upload.detailSpp);
                            sumNominal(upload.detailDigital);
                            sumNominal(upload.detailVokasi);
                            sumNominal(upload.detailCareer);
                            sumNominal(upload.detailSeragam);
                            sumNominal(upload.detailIplm);

                            if (upload.detailPrakerin && upload.detailPrakerin.length > 0) {
                                upload.detailPrakerin.forEach(item => {
                                    const uangNegeri = item.realisasiNegeri ? Number(item.realisasiNegeri.toString()) : 0;
                                    const uangSwasta = item.realisasiSwasta ? Number(item.realisasiSwasta.toString()) : 0;
                                    uangLaporan += (isNaN(uangNegeri) ? 0 : uangNegeri) + (isNaN(uangSwasta) ? 0 : uangSwasta);
                                });
                            }

                            if (upload.statusVerifikasi === 'Disetujui') {
                                totalDisetujuiFisik += jumlahFisik;
                                totalUangRealisasi += uangLaporan;
                            } else if (upload.statusVerifikasi === 'Menunggu') {
                                totalMenungguFisik += jumlahFisik;
                            }
                        });

                        const paguAnggaran = Number(sub.anggaran) || 0;
                        let persentaseFisik = sub.target > 0 ? (totalDisetujuiFisik / sub.target) * 100 : 0;
                        let persentaseKeuangan = paguAnggaran > 0 ? (totalUangRealisasi / paguAnggaran) * 100 : 0;

                        const formatRupiah = (angka) => {
                            return new Intl.NumberFormat('id-ID', {
                                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
                            }).format(angka);
                        };

                        return {
                            id: sub.id,
                            "Nama Sub Program": sub.namaSubProgram,
                            "Target Fisik": sub.target,
                            "Realisasi Fisik": totalDisetujuiFisik,
                            "Pending Fisik": totalMenungguFisik,
                            "Capaian Fisik": `${persentaseFisik.toFixed(2)}%`,
                            "Pagu Anggaran": formatRupiah(paguAnggaran),
                            "Realisasi Anggaran": formatRupiah(totalUangRealisasi),
                            "Sisa Anggaran": formatRupiah(paguAnggaran - totalUangRealisasi),
                            "Serapan Anggaran": `${persentaseKeuangan.toFixed(2)}%`,
                        };
                    })
                };
            });

            res.json({ status: "success", msg: "Data Monitoring Realisasi", data: monitoringData });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    // 2. DETAIL MONITORING (RINCIAN PER PROGRAM)
    getMonitoringDetail: async (req, res) => {
        try {
            const { programSlug, subProgramSlug } = req.params;

            const subProgram = await prisma.subProgramKerja.findFirst({
                where: {
                    slug: subProgramSlug,
                    programKerja: { slug: programSlug }
                },
                include: { programKerja: true }
            });

            if (!subProgram) {
                return res.status(404).json({ msg: "Data Sub Program tidak ditemukan." });
            }

            const subProgramId = subProgram.id;
            const nameLower = subProgram.namaSubProgram.toLowerCase();

            let data = [];
            let type = "";
            let totalFisik = 0;

            const formatRupiah = (angka) => {
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
                }).format(angka || 0);
            };

            const getNominal = (val) => val ? Number(val.toString()) : 0;

            // A. BEASISWA
            if (nameLower.includes('beasiswa')) {
                type = "beasiswa";
                const raw = await prisma.realisasiBeasiswa.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });
                totalFisik = raw.length;
                data = raw.map(item => ({
                    id: item.id,
                    "Nama Penerima": item.namaPenerima,
                    "NIK": item.nik || '-',
                    "NIM": item.nim || '-',
                    "Institusi Tujuan": item.institusiTujuan,
                    "Kabupaten / Kota": item.kabupaten,
                    "Alamat Lengkap": item.alamat || '-',
                    "Jalur Pendaftaran": item.jalur || '-',
                    "Nominal Bantuan": formatRupiah(getNominal(item.nominal)),
                    "Kontak Penerima": item.kontakPenerima || '-',
                }));

                // B. BOSDA / OPERASIONAL
            } else if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
                type = "bosda";
                const raw = await prisma.realisasiBosda.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });

                data = raw.map(item => {
                    const sumRow = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                    totalFisik += sumRow;
                    return {
                        id: item.id,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "SMA Negeri": `${item.smaNegeri || 0} Sekolah`,
                        "SMA Swasta": `${item.smaSwasta || 0} Sekolah`,
                        "SMK": `${item.smk || 0} Sekolah`,
                        "SLB Negeri": `${item.slbNegeri || 0} Sekolah`,
                        "SLB Swasta": `${item.slbSwasta || 0} Sekolah`,
                        "Total Sekolah": sumRow,
                        "Nominal Bantuan": formatRupiah(getNominal(item.nominal)),
                    };
                });

                // C. SPP / MISKIN (SUDAH DI UPDATE)
            } else if (nameLower.includes('spp') || nameLower.includes('miskin')) {
                type = "spp";
                const raw = await prisma.realisasiSpp.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });
                data = raw.map(item => {
                    const sumRow = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                    totalFisik += sumRow;
                    return {
                        id: item.id,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "Siswa SMA": `${item.siswaSma || 0} Siswa`,
                        "Realisasi SMA": formatRupiah(getNominal(item.realisasiSma)),
                        "Siswa SMK": `${item.siswaSmk || 0} Siswa`,
                        "Realisasi SMK": formatRupiah(getNominal(item.realisasiSmk)),
                        "Siswa SLB": `${item.siswaSlb || 0} Siswa`,
                        "Realisasi SLB": formatRupiah(getNominal(item.realisasiSlb)),
                        "Total Siswa": sumRow,
                        "Total Nominal": formatRupiah(getNominal(item.nominal)),
                    };
                });

                // D. PRAKERIN
            } else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
                type = "prakerin";
                const raw = await prisma.realisasiPrakerin.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });

                data = raw.map(item => {
                    const sumRow = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                    totalFisik += sumRow;
                    const uNegeri = getNominal(item.realisasiNegeri);
                    const uSwasta = getNominal(item.realisasiSwasta);
                    return {
                        id: item.id,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "SMK Negeri": `${item.smkNegeri || 0} Siswa`,
                        "Realisasi Negeri": formatRupiah(uNegeri),
                        "SMK Swasta": `${item.smkSwasta || 0} Siswa`,
                        "Realisasi Swasta": formatRupiah(uSwasta),
                        "Nominal Total": formatRupiah(uNegeri + uSwasta),
                    };
                });

                // E. DIGITALISASI / SARANA
            } else if (nameLower.includes('digital') || nameLower.includes('sarana')) {
                type = "digital";
                const raw = await prisma.realisasiDigital.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });
                totalFisik = raw.length;
                data = raw.map(item => ({
                    id: item.id,
                    "Nama Sekolah": item.namaSekolah,
                    "Jenis Barang": item.jenisBarang,
                    "Jumlah Unit": item.jumlahUnit,
                    "Kabupaten / Kota": item.kabupatenKota,
                    "Nominal Bantuan": formatRupiah(getNominal(item.nominal))
                }));

                // F. VOKASI / PELATIHAN
            } else if (nameLower.includes('vokasi') || nameLower.includes('siap kerja')) {
                type = "vokasi";
                const raw = await prisma.realisasiVokasi.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });

                data = raw.map(item => {
                    totalFisik += (Number(item.jumlahOrang) || 0);
                    return {
                        id: item.id,
                        "Rincian Kegiatan": item.rincianKegiatan,
                        "Jumlah Peserta": `${item.jumlahOrang} Orang`,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "Nominal Bantuan": formatRupiah(getNominal(item.nominal)),
                    };
                });

                // G. CAREER CENTER
            } else if (nameLower.includes('career') || nameLower.includes('karir')) {
                type = "career";
                const raw = await prisma.realisasiCareerCenter.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });

                data = raw.map(item => {
                    totalFisik += (Number(item.jumlahOrang) || 0);
                    return {
                        id: item.id,
                        "Nama Kegiatan": item.namaKegiatan,
                        "Lokasi Kegiatan": item.lokasi,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "Jumlah Peserta": `${item.jumlahOrang || 0} Orang`,
                        "Nominal Bantuan": formatRupiah(getNominal(item.nominal)),
                    };
                });

                // H. SERAGAM
            } else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
                type = "seragam";
                const raw = await prisma.realisasiSeragam.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });
                totalFisik = raw.length;
                data = raw.map(item => ({
                    id: item.id,
                    "Nama Sekolah": item.namaSekolah,
                    "Jumlah Siswa": `${item.jumlahSiswa} Siswa`,
                    "Kabupaten / Kota": item.kabupatenKota,
                    "Nominal Bantuan": formatRupiah(getNominal(item.nominal))
                }));

                // I. IPLM / LITERASI
            } else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
                type = "iplm";
                const raw = await prisma.realisasiIplm.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'asc' } }
                });

                data = raw.map(item => {
                    const jumlahOrang = Number(item.jumlahOrang) || 0;
                    totalFisik += jumlahOrang;
                    return {
                        id: item.id,
                        "Nama Kegiatan": item.namaKegiatan,
                        "Lokasi Kegiatan": item.lokasi || '-',
                        "Jumlah Orang": `${jumlahOrang} Orang`,
                        "Kabupaten / Kota": item.kabupatenKota,
                        "Nominal Bantuan": formatRupiah(getNominal(item.nominal)),
                    };
                });

            } else {
                return res.json({
                    status: "success",
                    msg: "Belum ada data detail untuk tipe sub program ini.",
                    program: subProgram.programKerja.namaProgram,
                    subProgram: subProgram.namaSubProgram,
                    data: []
                });
            }

            res.json({
                status: "success",
                program: subProgram.programKerja.namaProgram,
                programSlug: subProgram.programKerja.slug,
                subProgram: subProgram.namaSubProgram,
                subProgramSlug: subProgram.slug,
                type: type,
                totalData: totalFisik,
                data: data
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringController;