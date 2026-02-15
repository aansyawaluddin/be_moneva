import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {

    getMonitoringWilayah: async (req, res) => {
        try {
            const allPrograms = await prisma.programKerja.findMany({
                include: { subProgram: true },
                orderBy: { id: 'asc' }
            });

            const paguProgram = {};

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
                    detailSeragam: true
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

            const processItem = (kabupaten, nominal, namaProgram) => {
                const namaKota = cleanName(kabupaten);
                const realisasiUang = Number(nominal) || 0;

                rekapProvinsi.totalPenerima += 1;
                rekapProvinsi.totalRealisasi += realisasiUang;
                if (rekapProvinsi.programs[namaProgram]) {
                    rekapProvinsi.programs[namaProgram].totalPenerima += 1;
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

                mapWilayah[namaKota].totalPenerima += 1;
                mapWilayah[namaKota].totalRealisasi += realisasiUang;

                if (!mapWilayah[namaKota].programs[namaProgram]) {
                    mapWilayah[namaKota].programs[namaProgram] = {
                        totalPenerima: 0,
                        totalRealisasi: 0
                    };
                }

                mapWilayah[namaKota].programs[namaProgram].totalPenerima += 1;
                mapWilayah[namaKota].programs[namaProgram].totalRealisasi += realisasiUang;
            };

            allRealisasi.forEach(header => {
                const prog = header.subProgram?.programKerja?.namaProgram || 'Tanpa Program';

                const processDetailArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            processItem(namaKab, item.nominal, prog);
                        });
                    }
                };

                processDetailArray(header.detailBeasiswa, 'kabupaten');
                processDetailArray(header.detailBosda, 'kabupatenKota');
                processDetailArray(header.detailSpp, 'kabupatenKota');
                processDetailArray(header.detailPrakerin, 'kabupatenKota');
                processDetailArray(header.detailDigital, 'kabupatenKota');
                processDetailArray(header.detailVokasi, 'kabupatenKota');
                processDetailArray(header.detailCareer, 'lokasi');
                processDetailArray(header.detailSeragam, 'kabupatenKota');
            });

            const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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

                return {
                    namaKabupaten: kota.namaKabupaten,
                    totalPenerima: kota.totalPenerima,
                    totalRealisasi: formatRupiah(kota.totalRealisasi),
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