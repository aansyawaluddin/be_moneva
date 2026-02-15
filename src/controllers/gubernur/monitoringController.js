import prisma from '../../utils/prisma.js';

const monitoringController = {

    // DASHBOARD STATISTIK
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
                                    detailSeragam: true
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
                        let totalDisetujuiFisik = 0;
                        let totalMenungguFisik = 0;
                        let totalUangRealisasi = 0;

                        sub.dataRealisasi.forEach(upload => {
                            const jumlahBaris =
                                (upload.detailBeasiswa?.length || 0) +
                                (upload.detailBosda?.length || 0) +
                                (upload.detailSpp?.length || 0) +
                                (upload.detailPrakerin?.length || 0) +
                                (upload.detailDigital?.length || 0) +
                                (upload.detailVokasi?.length || 0) +
                                (upload.detailCareer?.length || 0) +
                                (upload.detailSeragam?.length || 0);

                            let uangLaporan = 0;
                            const sumNominal = (items) => {
                                if (!items) return;
                                items.forEach(item => {
                                    uangLaporan += Number(item.nominal) || 0;
                                });
                            };

                            sumNominal(upload.detailBeasiswa);
                            sumNominal(upload.detailBosda);
                            sumNominal(upload.detailSpp);
                            sumNominal(upload.detailPrakerin);
                            sumNominal(upload.detailDigital);
                            sumNominal(upload.detailVokasi);
                            sumNominal(upload.detailCareer);
                            sumNominal(upload.detailSeragam);

                            if (upload.statusVerifikasi === 'Disetujui') {
                                totalDisetujuiFisik += jumlahBaris;
                                totalUangRealisasi += uangLaporan;
                            } else if (upload.statusVerifikasi === 'Menunggu') {
                                totalMenungguFisik += jumlahBaris;
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
                            namaSubProgram: sub.namaSubProgram,
                            targetFisik: sub.target,
                            realisasiFisik: totalDisetujuiFisik,
                            pendingFisik: totalMenungguFisik,
                            capaianFisik: `${persentaseFisik.toFixed(2)}%`,
                            paguAnggaran: formatRupiah(paguAnggaran),
                            realisasiAnggaran: formatRupiah(totalUangRealisasi),
                            sisaAnggaran: formatRupiah(paguAnggaran - totalUangRealisasi),
                            serapanAnggaran: `${persentaseKeuangan.toFixed(2)}%`,
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

    // MONITORING DETAIL
    getMonitoringDetail: async (req, res) => {
        try {
            const { programSlug, subProgramSlug } = req.params;

            const subProgram = await prisma.subProgramKerja.findFirst({
                where: {
                    slug: subProgramSlug,
                    programKerja: {
                        slug: programSlug
                    }
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

            // A. BEASISWA
            if (nameLower.includes('beasiswa')) {
                type = "beasiswa";
                const raw = await prisma.realisasiBeasiswa.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    nama: item.namaPenerima,
                    registrasi: item.noRegistrasi,
                    kampus: item.institusiTujuan,
                    kabupaten: item.kabupaten,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // B. BOSDA / OPERASIONAL
            } else if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
                type = "bosda";
                const raw = await prisma.realisasiBosda.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    sekolah: item.namaSekolah,
                    kabupaten: item.kabupatenKota,
                    siswa: item.jumlahSiswa,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // C. SPP / MISKIN
            } else if (nameLower.includes('spp') || nameLower.includes('miskin')) {
                type = "spp";
                const raw = await prisma.realisasiSpp.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    sekolah: item.namaSekolah,
                    siswa: `Jml Siswa: ${item.jumlahSiswa}`,
                    kabupaten: item.kabupatenKota,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // D. PRAKERIN
            } else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
                type = "prakerin";
                const raw = await prisma.realisasiPrakerin.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    sekolah: item.namaSekolah,
                    siswa: `Jml Siswa: ${item.jumlahSiswa}`,
                    kabupaten: item.kabupatenKota,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // E. DIGITALISASI / SARANA
            } else if (nameLower.includes('digital') || nameLower.includes('sarana')) {
                type = "digital";
                const raw = await prisma.realisasiDigital.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    sekolah: item.namaSekolah,
                    barang: item.jenisBarang,
                    unit: item.jumlahUnit,
                    kabupaten: item.kabupatenKota,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // F. VOKASI / PELATIHAN
            } else if (nameLower.includes('vokasi') || nameLower.includes('siap kerja')) {
                type = "vokasi";
                const raw = await prisma.realisasiVokasi.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    peserta: item.namaPeserta,
                    nik: item.nik,
                    pelatihan: item.jenisPelatihan,
                    kabupaten: item.kabupatenKota,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // G. CAREER CENTER
            } else if (nameLower.includes('career') || nameLower.includes('karir')) {
                type = "career";
                const raw = await prisma.realisasiCareerCenter.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    kegiatan: item.namaKegiatan,
                    lokasi: item.lokasi,
                    tanggal: item.tanggalKegiatan,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

                // H. SERAGAM
            } else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
                type = "seragam";
                const raw = await prisma.realisasiSeragam.findMany({
                    where: { header: { subProgramId: subProgramId, statusVerifikasi: 'Disetujui' } },
                    include: { header: true },
                    orderBy: { header: { tanggalVerifikasi: 'desc' } }
                });
                data = raw.map(item => ({
                    id: item.id,
                    sekolah: item.namaSekolah,
                    siswa: `Jml Siswa: ${item.jumlahSiswa}`,
                    kabupaten: item.kabupatenKota,
                    nominal: item.nominal,
                    tanggalCair: item.header.tanggalVerifikasi
                }));

            } else {
                // Fallback jika tidak ada keyword yang cocok
                return res.json({
                    status: "success",
                    msg: "Belum ada data detail untuk tipe sub program ini.",
                    program: subProgram.programKerja.namaProgram,
                    subProgram: subProgram.namaSubProgram,
                    data: []
                });
            }

            // --- RESPONSE FINAL ---
            res.json({
                status: "success",
                program: subProgram.programKerja.namaProgram,
                programSlug: subProgram.programKerja.slug,
                subProgram: subProgram.namaSubProgram,
                subProgramSlug: subProgram.slug,
                type: type,
                totalData: data.length,
                data: data
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringController;