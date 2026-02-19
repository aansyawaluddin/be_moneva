import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {

    getMonitoringWilayah: async (req, res) => {
        try {
            const allPrograms = await prisma.programKerja.findMany({
                include: { subProgram: true },
                orderBy: { id: 'asc' }
            });

            const paguProgram = {};
            let totalAnggaranProvinsi = 0;

            const rekapProvinsi = {
                totalPenerima: 0,
                totalRealisasi: 0,
                programs: {}
            };

            allPrograms.forEach(p => {
                let totalPaguProgram = 0;
                p.subProgram.forEach(sub => {
                    totalPaguProgram += (Number(sub.anggaran) || 0);
                });
                paguProgram[p.namaProgram] = totalPaguProgram;
                totalAnggaranProvinsi += totalPaguProgram;

                rekapProvinsi.programs[p.namaProgram] = {
                    totalPenerima: 0,
                    totalRealisasi: 0
                };
            });

            const allRealisasi = await prisma.dataRealisasi.findMany({
                where: { statusVerifikasi: 'Disetujui' },
                include: {
                    subProgram: { include: { programKerja: true } },
                    detailBeasiswa: true,
                    detailBosda: true,
                    detailSpp: true,
                    detailPrakerin: true,
                    detailDigital: true,
                    detailVokasi: true,
                    detailCareer: true,
                    detailSeragam: true,
                    detailIplm: true // <-- TAMBAHAN IPLM
                }
            });

            const cleanName = (name) => {
                if (!name) return 'LAINNYA';
                let cleaned = name.toString().trim().toUpperCase()
                    .replace(/^KAB\.\s*/, '')
                    .replace(/^KABUPATEN\s*/, '')
                    .replace(/^KOTA\s*/, '')
                    .trim();

                if (cleaned === 'TOJO UNA UNA' || cleaned === 'TOJO UNAUNA') cleaned = 'TOJO UNA-UNA';
                if (cleaned === 'TOLI TOLI' || cleaned === 'TOLI-TOLI') cleaned = 'TOLITOLI';

                return cleaned;
            };

            const mapWilayah = {};

            const MASTER_WILAYAH = [
                "BANGGAI", "BANGGAI KEPULAUAN", "BANGGAI LAUT", "BUOL",
                "DONGGALA", "MOROWALI", "MOROWALI UTARA", "PALU",
                "PARIGI MOUTONG", "POSO", "SIGI", "TOJO UNA-UNA", "TOLITOLI"
            ];

            MASTER_WILAYAH.forEach(wilayah => {
                mapWilayah[wilayah] = {
                    namaKabupaten: wilayah,
                    totalPenerima: 0,
                    totalRealisasi: 0,
                    programs: {}
                };
            });

            const processItem = (kabupaten, nominal, jumlahPenerima, namaProgram) => {
                const namaKota = cleanName(kabupaten);
                const realisasiUang = Number(nominal) || 0;
                const penerima = Number(jumlahPenerima) || 0;

                rekapProvinsi.totalPenerima += penerima;
                rekapProvinsi.totalRealisasi += realisasiUang;

                if (rekapProvinsi.programs[namaProgram]) {
                    rekapProvinsi.programs[namaProgram].totalPenerima += penerima;
                    rekapProvinsi.programs[namaProgram].totalRealisasi += realisasiUang;
                }

                if (!mapWilayah[namaKota]) {
                    mapWilayah[namaKota] = {
                        namaKabupaten: namaKota,
                        totalPenerima: 0,
                        totalRealisasi: 0,
                        programs: {}
                    };
                }

                mapWilayah[namaKota].totalPenerima += penerima;
                mapWilayah[namaKota].totalRealisasi += realisasiUang;

                if (!mapWilayah[namaKota].programs[namaProgram]) {
                    mapWilayah[namaKota].programs[namaProgram] = {
                        totalPenerima: 0,
                        totalRealisasi: 0
                    };
                }

                mapWilayah[namaKota].programs[namaProgram].totalPenerima += penerima;
                mapWilayah[namaKota].programs[namaProgram].totalRealisasi += realisasiUang;
            };

            // Helper parsing Decimal Prisma aman dari NaN
            const parseNominal = (val) => val ? Number(val.toString()) : 0;

            allRealisasi.forEach(header => {
                const prog = header.subProgram?.programKerja?.namaProgram || 'Tanpa Program';

                // Fungsi Proses Standar (1 Baris = 1 Fisik)
                const processDetailArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const totalNominal = parseNominal(item.nominal);
                            processItem(namaKab, totalNominal, 1, prog);
                        });
                    }
                };

                // Fungsi Khusus BOSDA (Menghitung Total Semua Jenis Sekolah)
                const processBosdaArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const jumlahPenerima = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                            const totalNominal = parseNominal(item.nominal);

                            processItem(namaKab, totalNominal, jumlahPenerima, prog);
                        });
                    }
                };

                // Fungsi Khusus SPP (Menghitung Total Siswa)
                const processSppArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const jumlahPenerima = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                            const totalNominal = parseNominal(item.nominal);

                            processItem(namaKab, totalNominal, jumlahPenerima, prog);
                        });
                    }
                };

                // Fungsi Khusus Prakerin (Menghitung Total Negeri + Swasta)
                const processPrakerinArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const jumlahPenerima = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                            const totalNominal = parseNominal(item.realisasiNegeri) + parseNominal(item.realisasiSwasta);

                            processItem(namaKab, totalNominal, jumlahPenerima, prog);
                        });
                    }
                };

                // Fungsi Khusus Vokasi & Career (Menghitung jumlahOrang)
                const processOrangArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const jumlahPenerima = Number(item.jumlahOrang) || 0;
                            const totalNominal = parseNominal(item.nominal);

                            processItem(namaKab, totalNominal, jumlahPenerima, prog);
                        });
                    }
                };

                // Fungsi Khusus IPLM (Menghitung jumlahOrang)
                const processIplmArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            const jumlahPenerima = Number(item.jumlahOrang) || 0;
                            const totalNominal = parseNominal(item.nominal);

                            processItem(namaKab, totalNominal, jumlahPenerima, prog);
                        });
                    }
                };

                // --- PEMANGGILAN FUNGSI ---
                processDetailArray(header.detailBeasiswa, 'kabupaten');
                processBosdaArray(header.detailBosda, 'kabupatenKota');
                processSppArray(header.detailSpp, 'kabupatenKota');
                processPrakerinArray(header.detailPrakerin, 'kabupatenKota');
                processDetailArray(header.detailDigital, 'kabupatenKota');
                processOrangArray(header.detailVokasi, 'kabupatenKota');
                processOrangArray(header.detailCareer, 'kabupatenKota');
                processDetailArray(header.detailSeragam, 'kabupatenKota');
                processIplmArray(header.detailIplm, 'kabupatenKota');
            });

            const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

            const persenTotalProv = totalAnggaranProvinsi > 0
                ? (rekapProvinsi.totalRealisasi / totalAnggaranProvinsi) * 100
                : 0;
            const persenTotalProvDesimal = Number(persenTotalProv.toFixed(3));

            let listProgramsProvinsi = allPrograms.map(prog => {
                const progData = rekapProvinsi.programs[prog.namaProgram];
                const realisasiProg = progData ? progData.totalRealisasi : 0;
                const penerimaProg = progData ? progData.totalPenerima : 0;
                const anggaranProg = paguProgram[prog.namaProgram] || 0;

                const persentaseProg = anggaranProg > 0 ? (realisasiProg / anggaranProg) * 100 : 0;
                const persentaseDesimal = Number(persentaseProg.toFixed(3));

                return {
                    namaProgram: prog.namaProgram,
                    totalPenerima: penerimaProg,
                    anggaran: formatRupiah(anggaranProg),
                    totalRealisasi: formatRupiah(realisasiProg),
                    persentase: persentaseDesimal,
                    persentaseString: `${persentaseDesimal.toString().replace('.', ',')}%`
                };
            });

            const dataProvinsi = {
                namaKabupaten: "SULAWESI TENGAH (TOTAL PROVINSI)",
                totalPenerima: rekapProvinsi.totalPenerima,
                totalRealisasi: formatRupiah(rekapProvinsi.totalRealisasi),
                persentaseTotal: persenTotalProvDesimal,
                persentaseTotalString: `${persenTotalProvDesimal.toString().replace('.', ',')}%`,
                detailProgram: listProgramsProvinsi
            };

            let finalData = Object.values(mapWilayah).map(kota => {
                let listPrograms = allPrograms.map(prog => {
                    const progData = kota.programs[prog.namaProgram];
                    const realisasiProg = progData ? progData.totalRealisasi : 0;
                    const penerimaProg = progData ? progData.totalPenerima : 0;
                    const anggaranProg = paguProgram[prog.namaProgram] || 0;

                    const persentaseProg = anggaranProg > 0 ? (realisasiProg / anggaranProg) * 100 : 0;
                    const persentaseDesimal = Number(persentaseProg.toFixed(3));

                    return {
                        namaProgram: prog.namaProgram,
                        totalPenerima: penerimaProg,
                        anggaran: formatRupiah(anggaranProg),
                        totalRealisasi: formatRupiah(realisasiProg),
                        persentase: persentaseDesimal,
                        persentaseString: `${persentaseDesimal.toString().replace('.', ',')}%`
                    };
                });

                const persenTotalKota = totalAnggaranProvinsi > 0
                    ? (kota.totalRealisasi / totalAnggaranProvinsi) * 100
                    : 0;
                const persenTotalKotaDesimal = Number(persenTotalKota.toFixed(3));

                return {
                    namaKabupaten: kota.namaKabupaten,
                    totalPenerima: kota.totalPenerima,
                    totalRealisasi: formatRupiah(kota.totalRealisasi),
                    persentaseTotal: persenTotalKotaDesimal,
                    persentaseTotalString: `${persenTotalKotaDesimal.toString().replace('.', ',')}%`,
                    detailProgram: listPrograms
                };
            });

            finalData.sort((a, b) => a.namaKabupaten.localeCompare(b.namaKabupaten));

            finalData.unshift(dataProvinsi);

            res.json({
                status: "success",
                msg: "Data Monitoring Sebaran Wilayah",
                data: finalData
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringWilayahController;