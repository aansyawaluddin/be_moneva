import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {

    getMonitoringWilayah: async (req, res) => {
        try {
            const allRealisasi = await prisma.dataRealisasi.findMany({
                where: { statusVerifikasi: 'Disetujui' },
                include: {
                    subProgram: {
                        include: {
                            programKerja: true
                        }
                    },
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
                return name.toString().trim().toUpperCase()
                    .replace('KAB.', '')
                    .replace('KABUPATEN', '')
                    .replace('KOTA', '')
                    .trim();
            };

            const mapWilayah = {};

            const processItem = (kabupaten, nominal, namaProgram, namaSubProgram) => {
                const namaKota = cleanName(kabupaten);
                const uang = Number(nominal) || 0;

                if (!mapWilayah[namaKota]) {
                    mapWilayah[namaKota] = {
                        namaKabupaten: namaKota,
                        totalPenerima: 0,
                        totalAnggaran: 0,
                        programs: {} 
                    };
                }

                mapWilayah[namaKota].totalPenerima += 1;
                mapWilayah[namaKota].totalAnggaran += uang;

                if (!mapWilayah[namaKota].programs[namaProgram]) {
                    mapWilayah[namaKota].programs[namaProgram] = {
                        namaProgram: namaProgram,
                        totalPenerima: 0,
                        totalAnggaran: 0,
                        subPrograms: {} 
                    };
                }

                mapWilayah[namaKota].programs[namaProgram].totalPenerima += 1;
                mapWilayah[namaKota].programs[namaProgram].totalAnggaran += uang;

                if (!mapWilayah[namaKota].programs[namaProgram].subPrograms[namaSubProgram]) {
                    mapWilayah[namaKota].programs[namaProgram].subPrograms[namaSubProgram] = {
                        namaSubProgram: namaSubProgram,
                        totalPenerima: 0,
                        totalAnggaran: 0
                    };
                }

                mapWilayah[namaKota].programs[namaProgram].subPrograms[namaSubProgram].totalPenerima += 1;
                mapWilayah[namaKota].programs[namaProgram].subPrograms[namaSubProgram].totalAnggaran += uang;
            };

            allRealisasi.forEach(header => {
                const prog = header.subProgram?.programKerja?.namaProgram || 'Tanpa Program';
                const sub = header.subProgram?.namaSubProgram || 'Tanpa Sub Program';

                const processDetailArray = (arrayDetail, fieldKabupaten) => {
                    if (arrayDetail && arrayDetail.length > 0) {
                        arrayDetail.forEach(item => {
                            const namaKab = item[fieldKabupaten] || 'Lainnya';
                            processItem(namaKab, item.nominal, prog, sub);
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

            let finalData = Object.values(mapWilayah).map(kota => {

                let listPrograms = Object.values(kota.programs).map(prog => {

                    let listSub = Object.values(prog.subPrograms).map(sub => ({
                        namaSubProgram: sub.namaSubProgram,
                        totalPenerima: sub.totalPenerima,
                        totalAnggaran: formatRupiah(sub.totalAnggaran),
                        rawAnggaran: sub.totalAnggaran 
                    }));

                    listSub.sort((a, b) => b.rawAnggaran - a.rawAnggaran);
                    listSub.forEach(d => delete d.rawAnggaran);

                    return {
                        namaProgram: prog.namaProgram,
                        totalPenerima: prog.totalPenerima,
                        totalAnggaran: formatRupiah(prog.totalAnggaran),
                        rawAnggaran: prog.totalAnggaran,
                        detailSubProgram: listSub
                    };
                });

                listPrograms.sort((a, b) => b.rawAnggaran - a.rawAnggaran);
                listPrograms.forEach(d => delete d.rawAnggaran);

                return {
                    namaKabupaten: kota.namaKabupaten,
                    totalPenerima: kota.totalPenerima,
                    totalAnggaran: formatRupiah(kota.totalAnggaran),
                    rawAnggaran: kota.totalAnggaran, 
                    detailProgram: listPrograms
                };
            });

            finalData.sort((a, b) => b.rawAnggaran - a.rawAnggaran);
            finalData.forEach(d => delete d.rawAnggaran);

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