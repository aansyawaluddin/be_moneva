import prisma from '../../utils/prisma.js';

const rankingOpdController = {
    getRankingOpd: async (req, res) => {
        try {
            const { tahun } = req.query;
            const tahunFilter = tahun ? parseInt(tahun) : undefined;

            const kadisList = await prisma.user.findMany({ where: { role: 'Kepala Dinas' }, select: { dinas: true, programKerjaId: true } });
            const mapProgramToDinas = {};
            kadisList.forEach(k => { if (k.programKerjaId && k.dinas) mapProgramToDinas[k.programKerjaId] = k.dinas; });

            const allPrograms = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            targetTahunan: tahunFilter ? { where: { tahun: tahunFilter } } : true,
                            dataRealisasi: {
                                where: {
                                    statusVerifikasi: 'Disetujui',
                                    ...(tahunFilter ? { tahun: tahunFilter } : {})
                                },
                                include: {
                                    // Berani Cerdas
                                    detailBosda: true, detailSpp: true, detailBeasiswaCerdas: true,
                                    detailPrakerin: true, detailBeasiswa: true, detailBeasiswaMiskin: true,
                                    detailDigital: true, detailVokasi: true, detailCareer: true,
                                    detailIplm: true, detailSeragam: true,
                                    // Berani Sehat
                                    detailPemeriksaanGratis: true, detailNasehaKami: true,
                                    detailRsRujukan: true, detailStunting: true, detailKualitasRs: true,
                                    // Berani Sejahtera
                                    detailJaminanHarga: true, detailPanada: true, detailUep: true,
                                    detailRutilahu: true, detailUmkm: true, detailMbg: true,
                                    // Berani Lancar
                                    detailAirBersih: true, detailDrainase: true, detailMyc: true,
                                    detailAgropolitan: true, detailJalanDesa: true,
                                    detailKonektivitasBanggai: true, detailKonektivitasTambu: true,
                                    // Berani Menyala
                                    detailAksesListrik: true, detailInternetDesa: true,
                                    // Berani Harmoni
                                    detailWirausaha: true, detailBerbudaya: true, detailInvestasi: true,
                                    detailBermitra: true, detailHarmoniCareer: true, detailEkonomiKreatif: true,
                                    detailLestari: true, detailProduktif: true, detailWisata: true, detailOlahraga: true,
                                    // Berani Integritas
                                    detailGaspoll: true, detailSpbe: true, detailBudayaKerja: true, detailBantuanKeuangan: true,
                                }
                            }
                        }
                    }
                }
            });


            const normalizeWhitespace = (str) => {
                if (!str) return '';
                return str.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
            };

            const DINAS_ALIAS_GROUPS = [
                {
                    canonical: 'Dinas Pemberdayaan Perempuan dan Perlindungan Anak',
                    aliases: [
                        'Dinas Pemberdayaan Anak dan Perlindungan Anak',
                    ]
                },
                {
                    canonical: 'Dinas Cipta Karya dan Sumber Daya Air',
                    aliases: [
                        'Dinas CiptaKaryadan SumberDaya Air', 
                    ]
                },
                {
                    canonical: 'Biro Administrasi Perekonomian',
                    aliases: [
                        'Biro administrasi Perekonomin', 
                    ]
                },
                {
                    canonical: 'Dinas Koperasi, Usaha Kecil dan Menengah',
                    aliases: [
                        'Dinas Koperasi, uzaha kecil dan menengah', 
                    ]
                },
                {
                    canonical: 'Dinas Komunikasi dan Informasi dan Persandian',
                    aliases: [
                        'Dinas Komunikasi dan Informasidan Persandian', 
                    ]
                },
                {
                    canonical: 'Biro Administrasi Pembangunan',
                    aliases: [
                        'Brio Administrasi Pembangunan', 
                    ]
                },
            ];

            const DINAS_ALIAS_MAP = {};
            DINAS_ALIAS_GROUPS.forEach(group => {
                [group.canonical, ...group.aliases].forEach(name => {
                    DINAS_ALIAS_MAP[normalizeWhitespace(name).toLowerCase()] = group.canonical;
                });
            });

            const canonicalizeDinas = (raw) => {
                const normalized = normalizeWhitespace(raw);
                if (!normalized) return '';
                return DINAS_ALIAS_MAP[normalized.toLowerCase()] || normalized;
            };

            const opdStats = {};
            const getOpd = (namaDinasRaw) => {
                const key = canonicalizeDinas(namaDinasRaw) || 'Dinas Tidak Diketahui';
                if (!opdStats[key]) opdStats[key] = { namaDinas: key, totalPagu: 0, totalRealisasi: 0 };
                return opdStats[key];
            };

            const toNum = (val) => (val ? Number(val.toString()) : 0);

            const addSimple = (items, getValue, dinasProgram) => {
                if (!items) return;
                items.forEach(item => { getOpd(dinasProgram).totalRealisasi += getValue(item); });
            };


            const addByPerangkatDaerah = (items, getValue, dinasProgram) => {
                if (!items) return;
                items.forEach(item => {
                    const namaDinasRow = (item.perangkatDaerah && item.perangkatDaerah.trim()) || dinasProgram;
                    getOpd(namaDinasRow).totalRealisasi += getValue(item);
                });
            };

            allPrograms.forEach(prog => {
                const namaDinasProgram = mapProgramToDinas[prog.id] || 'Dinas Tidak Diketahui';

                prog.subProgram.forEach(sub => {
                    const paguSub = (sub.targetTahunan || []).reduce((acc, t) => acc + toNum(t.anggaran), 0);
                    getOpd(namaDinasProgram).totalPagu += paguSub;

                    sub.dataRealisasi.forEach(upload => {
                        // ===== Berani Cerdas (tanpa perangkatDaerah) =====
                        addSimple(upload.detailBosda, i => toNum(i.nominal), namaDinasProgram);
                        addSimple(upload.detailSpp, i => toNum(i.nominal), namaDinasProgram);
                        addSimple(upload.detailBeasiswaCerdas, i => toNum(i.realisasi), namaDinasProgram);
                        addSimple(upload.detailBeasiswaMiskin, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailPrakerin, i => toNum(i.realisasiNegeri) + toNum(i.realisasiSwasta), namaDinasProgram);
                        addSimple(upload.detailDigital, i => toNum(i.realisasi), namaDinasProgram);
                        addSimple(upload.detailVokasi, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailCareer, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailIplm, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailSeragam, i => toNum(i.nominal), namaDinasProgram);
                        addSimple(upload.detailBeasiswa, i => toNum(i.nominal), namaDinasProgram);

                        // ===== Berani Sehat (tanpa perangkatDaerah) =====
                        addSimple(upload.detailPemeriksaanGratis, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailNasehaKami, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailRsRujukan, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailStunting, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailKualitasRs, i => toNum(i.realisasiAnggaran), namaDinasProgram);

                        // ===== Berani Lancar: sebagian punya perangkatDaerah, sebagian tidak =====
                        addSimple(upload.detailAirBersih, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailDrainase, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailMyc, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailAgropolitan, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailJalanDesa, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailKonektivitasBanggai, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailKonektivitasTambu, i => toNum(i.realisasiAnggaran), namaDinasProgram);

                        // ===== Berani Menyala (tanpa perangkatDaerah) =====
                        addSimple(upload.detailAksesListrik, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addSimple(upload.detailInternetDesa, i => toNum(i.realisasiAnggaran), namaDinasProgram);

                        // ===== Berani Sejahtera (semua punya perangkatDaerah) =====
                        addByPerangkatDaerah(upload.detailJaminanHarga, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailPanada, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailUep, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailRutilahu, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailUmkm, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailMbg, i => toNum(i.realisasiAnggaran), namaDinasProgram);

                        // ===== Berani Harmoni (semua punya perangkatDaerah) =====
                        addByPerangkatDaerah(upload.detailWirausaha, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailBerbudaya, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailInvestasi, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailBermitra, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailHarmoniCareer, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailEkonomiKreatif, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailLestari, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailProduktif, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailWisata, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailOlahraga, i => toNum(i.realisasiAnggaran), namaDinasProgram);

                        // ===== Berani Integritas (semua punya perangkatDaerah) =====
                        addByPerangkatDaerah(upload.detailGaspoll, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailSpbe, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailBudayaKerja, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                        addByPerangkatDaerah(upload.detailBantuanKeuangan, i => toNum(i.realisasiAnggaran), namaDinasProgram);
                    });
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
            rankingArray = rankingArray.map((item, index) => { delete item.rawPersentase; return { peringkat: index + 1, ...item }; });

            res.json({ status: "success", msg: "Data Ranking OPD berdasarkan Serapan Anggaran", data: rankingArray });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default rankingOpdController;