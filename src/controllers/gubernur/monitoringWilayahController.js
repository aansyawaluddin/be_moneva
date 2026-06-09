import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {

    getMonitoringWilayah: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const allPrograms = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            targetTahunan: {
                                where: { tahun }
                            }
                        }
                    }
                },
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
                    const targetData = sub.targetTahunan[0];
                    totalPaguProgram += targetData?.anggaran ? Number(targetData.anggaran) : 0;
                });
                paguProgram[p.namaProgram] = totalPaguProgram;
                totalAnggaranProvinsi += totalPaguProgram;

                rekapProvinsi.programs[p.namaProgram] = {
                    totalPenerima: 0,
                    totalRealisasi: 0
                };
            });

            const allRealisasi = await prisma.dataRealisasi.findMany({
                where: {
                    statusVerifikasi: 'Disetujui',
                    tahun
                },
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
                    detailIplm: true
                }
            });

            const cleanName = (name) => {
                if (!name) return 'LAINNYA';
                let cleaned = name.toString().trim().toUpperCase()
                    .replace(/^KAB\.\s*/, '')
                    .replace(/^KABUPATEN\s*/, '')
                    .replace(/^KOTA\s*/, '')
                    .trim();

                if (cleaned === 'TOUNA' || cleaned === 'TOJO UNA-UNA' || cleaned === 'TOJO UNAUNA') cleaned = 'TOJO UNA UNA';
                if (cleaned === 'TOLITOLI' || cleaned === 'TOLI-TOLI') cleaned = 'TOLI TOLI';
                if (cleaned === 'BANGGAI KEPUALUAN') cleaned = 'BANGGAI KEPULAUAN';

                return cleaned;
            };

            const DISPLAY_WILAYAH = {
                "BANGGAI": "Kabupaten Banggai",
                "BANGGAI KEPULAUAN": "Kabupaten Banggai Kepulauan",
                "BANGGAI LAUT": "Kabupaten Banggai Laut",
                "BUOL": "Kabupaten Buol",
                "DONGGALA": "Kabupaten Donggala",
                "MOROWALI": "Kabupaten Morowali",
                "MOROWALI UTARA": "Kabupaten Morowali Utara",
                "PARIGI MOUTONG": "Kabupaten Parigi Moutong",
                "POSO": "Kabupaten Poso",
                "SIGI": "Kabupaten Sigi",
                "TOJO UNA UNA": "Kabupaten Tojo Una Una",
                "TOLI TOLI": "Kabupaten Toli Toli",
                "PALU": "Kota Palu",
                "LAINNYA": "Lainnya"
            };

            const mapWilayah = {};
            const MASTER_WILAYAH = Object.keys(DISPLAY_WILAYAH).filter(k => k !== "LAINNYA");

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
                    mapWilayah[namaKota].programs[namaProgram] = { totalPenerima: 0, totalRealisasi: 0 };
                }

                mapWilayah[namaKota].programs[namaProgram].totalPenerima += penerima;
                mapWilayah[namaKota].programs[namaProgram].totalRealisasi += realisasiUang;
            };

            const parseNominal = (val) => val ? Number(val.toString()) : 0;

            allRealisasi.forEach(header => {
                const prog = header.subProgram?.programKerja?.namaProgram || 'Tanpa Program';

                const processDetailArray = (arr, fieldKab) => {
                    arr?.forEach(item => processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), 1, prog));
                };
                const processBosdaArray = (arr, fieldKab) => {
                    arr?.forEach(item => {
                        const jml = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0);
                        processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), jml, prog);
                    });
                };
                const processSppArray = (arr, fieldKab) => {
                    arr?.forEach(item => {
                        const jml = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0);
                        processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), jml, prog);
                    });
                };
                const processPrakerinArray = (arr, fieldKab) => {
                    arr?.forEach(item => {
                        const jml = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0);
                        processItem(item[fieldKab] || 'Lainnya', parseNominal(item.realisasiNegeri) + parseNominal(item.realisasiSwasta), jml, prog);
                    });
                };
                const processOrangArray = (arr, fieldKab) => {
                    arr?.forEach(item => processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), Number(item.jumlahOrang) || 0, prog));
                };

                processDetailArray(header.detailBeasiswa, 'kabupaten');
                processBosdaArray(header.detailBosda, 'kabupatenKota');
                processSppArray(header.detailSpp, 'kabupatenKota');
                processPrakerinArray(header.detailPrakerin, 'kabupatenKota');
                processDetailArray(header.detailDigital, 'kabupatenKota');
                processOrangArray(header.detailVokasi, 'kabupatenKota');
                processOrangArray(header.detailCareer, 'kabupatenKota');
                processDetailArray(header.detailSeragam, 'kabupatenKota');
                processOrangArray(header.detailIplm, 'kabupatenKota');
            });

            const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

            const buildProgramList = (programsData) => allPrograms.map(prog => {
                const progData = programsData[prog.namaProgram];
                const realisasiProg = progData?.totalRealisasi ?? 0;
                const penerimaProg = progData?.totalPenerima ?? 0;
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

            const persenTotalProv = totalAnggaranProvinsi > 0 ? (rekapProvinsi.totalRealisasi / totalAnggaranProvinsi) * 100 : 0;
            const persenTotalProvDesimal = Number(persenTotalProv.toFixed(3));

            const dataProvinsi = {
                namaKabupaten: "SULAWESI TENGAH (TOTAL PROVINSI)",
                totalPenerima: rekapProvinsi.totalPenerima,
                totalRealisasi: formatRupiah(rekapProvinsi.totalRealisasi),
                persentaseTotal: persenTotalProvDesimal,
                persentaseTotalString: `${persenTotalProvDesimal.toString().replace('.', ',')}%`,
                detailProgram: buildProgramList(rekapProvinsi.programs)
            };

            let finalData = Object.keys(mapWilayah).map(rawName => {
                const kota = mapWilayah[rawName];
                const persenTotalKota = totalAnggaranProvinsi > 0 ? (kota.totalRealisasi / totalAnggaranProvinsi) * 100 : 0;
                const persenTotalKotaDesimal = Number(persenTotalKota.toFixed(3));
                return {
                    namaKabupaten: DISPLAY_WILAYAH[rawName] || rawName,
                    totalPenerima: kota.totalPenerima,
                    totalRealisasi: formatRupiah(kota.totalRealisasi),
                    persentaseTotal: persenTotalKotaDesimal,
                    persentaseTotalString: `${persenTotalKotaDesimal.toString().replace('.', ',')}%`,
                    detailProgram: buildProgramList(kota.programs)
                };
            });

            finalData.sort((a, b) => a.namaKabupaten.localeCompare(b.namaKabupaten));
            finalData.unshift(dataProvinsi);

            res.json({
                status: "success",
                msg: "Data Monitoring Sebaran Wilayah",
                tahun,
                data: finalData
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringWilayahController;