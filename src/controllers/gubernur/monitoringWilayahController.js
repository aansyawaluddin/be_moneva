import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {

    getMonitoringWilayah: async (req, res) => {
        try {
            const allRealisasi = await prisma.dataRealisasi.findMany({
                where: { statusVerifikasi: 'Disetujui' },
                include: {
                    kategori: {
                        include: {
                            subProgram: {
                                include: {
                                    programKerja: true
                                }
                            }
                        }
                    },
                    detailBeasiswa: true,
                    detailBosda: true,
                    detailSeragam: true,
                    detailPkl: true,
                    detailGuru: true,
                    detailBeasiswaMiskin: true,
                    detailStarlink: true
                }
            });

            const cleanName = (name) => {
                if (!name) return 'LAINNYA';
                return name.trim().toUpperCase()
                    .replace('KAB.', '')
                    .replace('KOTA', '')
                    .trim();
            };

            const mapWilayah = {};

            const processItem = (kabupaten, nominal, namaProgram, namaSubProgram) => {
                const namaKota = cleanName(kabupaten);
                const uang = Number(nominal) || 0;

                // Init Wilayah
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

                // Init Program
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

                // Init Sub Program
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
                const prog = header.kategori?.subProgram?.programKerja?.namaProgram || 'Tanpa Program';
                const sub = header.kategori?.subProgram?.namaSubProgram || 'Tanpa Sub Program';

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
                processDetailArray(header.detailSeragam, 'kabupatenKota');
                processDetailArray(header.detailPkl, 'kabupatenKota');
                processDetailArray(header.detailGuru, 'kabupatenKota'); 
                processDetailArray(header.detailBeasiswaMiskin, 'kabupatenKota');
                processDetailArray(header.detailStarlink, 'kabupatenKota');
            });

            const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

            const finalData = Object.values(mapWilayah).map(kota => {
                const detailProgram = Object.values(kota.programs).map(prog => {
                    const detailSubProgram = Object.values(prog.subPrograms).map(sub => ({
                        namaSubProgram: sub.namaSubProgram,
                        totalPenerima: sub.totalPenerima,
                        totalAnggaran: formatRupiah(sub.totalAnggaran),
                        raw: sub.totalAnggaran
                    }));
                    detailSubProgram.sort((a, b) => b.raw - a.raw);
                    detailSubProgram.forEach(d => delete d.raw);

                    return {
                        namaProgram: prog.namaProgram,
                        totalAnggaran: formatRupiah(prog.totalAnggaran),
                        raw: prog.totalAnggaran,
                        detailSubProgram: detailSubProgram
                    };
                });
                detailProgram.sort((a, b) => b.raw - a.raw);
                detailProgram.forEach(d => delete d.raw);

                return {
                    namaKabupaten: kota.namaKabupaten,
                    totalAnggaran: formatRupiah(kota.totalAnggaran),
                    raw: kota.totalAnggaran,
                    detailProgram: detailProgram
                };
            });

            finalData.sort((a, b) => b.raw - a.raw);
            finalData.forEach(d => delete d.raw);

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