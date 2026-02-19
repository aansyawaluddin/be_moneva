import prisma from '../../utils/prisma.js';

const rankingOpdController = {

    getRankingOpd: async (req, res) => {
        try {
            const kadisList = await prisma.user.findMany({
                where: { role: 'Kepala Dinas' },
                select: { dinas: true, programKerjaId: true }
            });

            const mapProgramToDinas = {};
            kadisList.forEach(k => {
                if (k.programKerjaId && k.dinas) {
                    mapProgramToDinas[k.programKerjaId] = k.dinas;
                }
            });

            const allPrograms = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
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

            const opdStats = {};

            allPrograms.forEach(prog => {
                const namaDinas = mapProgramToDinas[prog.id] || 'Dinas Tidak Diketahui';

                if (!opdStats[namaDinas]) {
                    opdStats[namaDinas] = {
                        namaDinas: namaDinas,
                        totalPagu: 0,
                        totalRealisasi: 0
                    };
                }

                prog.subProgram.forEach(sub => {
                    opdStats[namaDinas].totalPagu += (Number(sub.anggaran) || 0);

                    let realisasiUang = 0;

                    sub.dataRealisasi.forEach(upload => {
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

                                const totalNegeri = isNaN(uangNegeri) ? 0 : uangNegeri;
                                const totalSwasta = isNaN(uangSwasta) ? 0 : uangSwasta;

                                return acc + totalNegeri + totalSwasta;
                            }, 0);
                        };

                        realisasiUang += sumNominal(upload.detailBeasiswa);
                        realisasiUang += sumNominal(upload.detailBosda);
                        realisasiUang += sumNominal(upload.detailSpp);

                        realisasiUang += sumPrakerin(upload.detailPrakerin);

                        realisasiUang += sumNominal(upload.detailDigital);

                        realisasiUang += sumNominal(upload.detailVokasi);

                        realisasiUang += sumNominal(upload.detailCareer);
                        realisasiUang += sumNominal(upload.detailSeragam);
                        realisasiUang += sumNominal(upload.detailIplm); 
                    });

                    opdStats[namaDinas].totalRealisasi += realisasiUang;
                });
            });

            const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

            let rankingArray = Object.values(opdStats).map(opd => {
                const persentase = opd.totalPagu > 0 ? (opd.totalRealisasi / opd.totalPagu) * 100 : 0;

                const persentaseDesimal = Number(persentase.toFixed(3));

                return {
                    namaDinas: opd.namaDinas,
                    paguAnggaran: formatRupiah(opd.totalPagu),
                    totalRealisasi: formatRupiah(opd.totalRealisasi),
                    persentase: persentaseDesimal,
                    persentaseString: `${persentaseDesimal.toString().replace('.', ',')}%`,
                    rawPersentase: persentase
                };
            });

            rankingArray.sort((a, b) => b.rawPersentase - a.rawPersentase);

            rankingArray = rankingArray.map((item, index) => {
                delete item.rawPersentase;
                return {
                    peringkat: index + 1,
                    ...item
                };
            });

            res.json({
                status: "success",
                msg: "Data Ranking OPD berdasarkan Serapan Anggaran",
                data: rankingArray
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default rankingOpdController;