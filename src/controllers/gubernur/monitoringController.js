import prisma from '../../utils/prisma.js';

const monitoringController = {

    // DASHBOARD STATISTIK (Rekapitulasi)
    getMonitoringStats: async (req, res) => {
        try {
            const allData = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            kategori: {
                                include: {
                                    dataRealisasi: {
                                        include: {
                                            detailBeasiswa: true,
                                            detailBosda: true,
                                            detailSeragam: true,
                                            detailPkl: true,
                                            detailBeasiswaMiskin: true,
                                            detailGuru: true,
                                            detailStarlink: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const monitoringData = allData.map(program => {
                return {
                    id: program.id,
                    namaProgram: program.namaProgram,
                    subPrograms: program.subProgram.map(sub => {

                        let totalDisetujui = 0;
                        let totalMenunggu = 0;
                        let totalUang = 0;

                        sub.kategori.forEach(kat => {
                            kat.dataRealisasi.forEach(upload => {
                                const jumlahData =
                                    (upload.detailBeasiswa?.length || 0) +
                                    (upload.detailBosda?.length || 0) +
                                    (upload.detailSeragam?.length || 0) +
                                    (upload.detailPkl?.length || 0) +
                                    (upload.detailBeasiswaMiskin?.length || 0) +
                                    (upload.detailGuru?.length || 0) +
                                    (upload.detailStarlink?.length || 0);

                                if (upload.statusVerifikasi === 'Disetujui') {
                                    totalDisetujui += jumlahData;

                                    const sumNominal = (items) => {
                                        if (!items) return;
                                        items.forEach(item => {
                                            totalUang += Number(item.nominal) || 0;
                                        });
                                    };

                                    sumNominal(upload.detailBeasiswa);
                                    sumNominal(upload.detailBosda);
                                    sumNominal(upload.detailSeragam);
                                    sumNominal(upload.detailPkl);
                                    sumNominal(upload.detailBeasiswaMiskin);
                                    sumNominal(upload.detailGuru);
                                    sumNominal(upload.detailStarlink);

                                } else if (upload.statusVerifikasi === 'Menunggu') {
                                    totalMenunggu += jumlahData;
                                }
                            });
                        });

                        const paguAnggaran = Number(sub.anggaran) || 0;

                        let rawPersentaseFisik = sub.target > 0
                            ? (totalDisetujui / sub.target) * 100
                            : 0;

    
                        let rawPersentaseKeuangan = paguAnggaran > 0
                            ? (totalUang / paguAnggaran) * 100
                            : 0;

                        const formatRupiah = (angka) => {
                            return new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(angka);
                        };

                        return {
                            id: sub.id,
                            namaSubProgram: sub.namaSubProgram,

                            targetFisik: sub.target,
                            realisasiFisik: totalDisetujui,
                            pendingFisik: totalMenunggu,
                            capaianFisik: `${rawPersentaseFisik.toFixed(2)}%`,

                            paguAnggaran: formatRupiah(paguAnggaran),          
                            realisasiAnggaran: formatRupiah(totalUang),      
                            sisaAnggaran: formatRupiah(paguAnggaran - totalUang), 
                            serapanAnggaran: `${rawPersentaseKeuangan.toFixed(2)}%`, 

                        };
                    })
                };
            });

            res.json({
                status: "success",
                msg: "Data Monitoring Realisasi Program & Anggaran",
                data: monitoringData
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: BEASISWA
    getMonitoringBeasiswa: async (req, res) => {
        try {
            const recipients = await prisma.realisasiBeasiswa.findMany({
                where: {
                    header: { statusVerifikasi: 'Disetujui' }
                },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = recipients.map(item => ({
                id: item.id,
                namaPenerima: item.namaPenerima,
                noRegistrasi: item.noRegistrasi,
                kampus: item.institusiTujuan,
                alamat: item.alamat,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "beasiswa", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: BOSDA
    getMonitoringBosda: async (req, res) => {
        try {
            const schools = await prisma.realisasiBosda.findMany({
                where: {
                    header: { statusVerifikasi: 'Disetujui' }
                },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = schools.map(item => ({
                id: item.id,
                namaSekolah: item.namaSekolah,
                kabupaten: item.kabupatenKota,
                jumlahSiswa: item.jumlahSiswa,
                pagu: item.totalPagu,
                realisasi: item.realisasi,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "bosda", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: SERAGAM
    getMonitoringSeragam: async (req, res) => {
        try {
            const data = await prisma.realisasiSeragam.findMany({
                where: { header: { statusVerifikasi: 'Disetujui' } },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = data.map(item => ({
                id: item.id,
                namaSekolah: item.namaSekolah,
                kabupaten: item.kabupatenKota,
                jumlahSiswa: item.jumlahSiswa,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "seragam", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: PKL
    getMonitoringPkl: async (req, res) => {
        try {
            const data = await prisma.realisasiPkl.findMany({
                where: { header: { statusVerifikasi: 'Disetujui' } },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = data.map(item => ({
                id: item.id,
                namaSekolah: item.namaSekolah,
                kabupaten: item.kabupatenKota,
                jumlahSiswa: item.jumlahSiswa,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "pkl", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: BEASISWA MISKIN
    getMonitoringMiskin: async (req, res) => {
        try {
            const data = await prisma.realisasiBeasiswaMiskin.findMany({
                where: { header: { statusVerifikasi: 'Disetujui' } },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = data.map(item => ({
                id: item.id,
                namaSekolah: item.namaSekolah,
                kabupaten: item.kabupatenKota,
                jumlahSiswa: item.jumlahSiswa,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "miskin", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: GURU
    getMonitoringGuru: async (req, res) => {
        try {
            const data = await prisma.realisasiGuru.findMany({
                where: { header: { statusVerifikasi: 'Disetujui' } },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = data.map(item => ({
                id: item.id,
                namaGuru: item.namaGuru,
                nomorRegistrasi: item.nomorRegistrasi,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "guru", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    // MONITORING DETAIL: DIGITALISASI / STARLINK
    getMonitoringDigital: async (req, res) => {
        try {
            const data = await prisma.realisasiDigitalisasi.findMany({
                where: { header: { statusVerifikasi: 'Disetujui' } },
                include: {
                    header: {
                        include: {
                            kategori: {
                                include: {
                                    subProgram: { include: { programKerja: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { header: { tanggalVerifikasi: 'desc' } }
            });

            const formatted = data.map(item => ({
                id: item.id,
                namaSekolah: item.namaSekolah,
                kabupaten: item.kabupatenKota,
                nominal: item.nominal,
                program: item.header.kategori.subProgram.programKerja.namaProgram,
                subProgram: item.header.kategori.subProgram.namaSubProgram,
                kategori: item.header.kategori.namaKategori,
            }));

            res.json({ status: "success", type: "digital", data: formatted });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringController;