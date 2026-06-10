import prisma from '../../utils/prisma.js';

const monitoringController = {

    getMonitoringStats: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const allData = await prisma.programKerja.findMany({
                include: {
                    subProgram: {
                        include: {
                            targetTahunan: { where: { tahun } },
                            dataRealisasi: {
                                where: { tahun },
                                include: {
                                    detailBosda: true, detailSpp: true,
                                    detailBeasiswaCerdas: true, detailBeasiswaMiskin: true,
                                    detailPrakerin: true, detailDigital: true,
                                    detailVokasi: true, detailCareer: true,
                                    detailIplm: true, detailSeragam: true, detailBeasiswa: true,
                                }
                            }
                        }
                    }
                }
            });

            const monitoringData = allData.map(program => ({
                id: program.id,
                "Nama Program": program.namaProgram,
                "Tahun": tahun,
                "Daftar Sub Program": program.subProgram.map(sub => {
                    const targetData = sub.targetTahunan[0];
                    const targetFisik = targetData?.target ?? 0;
                    const paguAnggaran = targetData?.anggaran ? Number(targetData.anggaran) : 0;
                    let totalDisetujuiFisik = 0, totalMenungguFisik = 0, totalUangRealisasi = 0;

                    sub.dataRealisasi.forEach(upload => {
                        let jumlahFisik = 0;

                        jumlahFisik += upload.detailBeasiswa?.length || 0;
                        jumlahFisik += upload.detailSeragam?.length || 0;
                        if (upload.detailDigital?.length > 0) upload.detailDigital.forEach(item => { jumlahFisik += Number(item.jumlahSekolah) || 0; });
                        if (upload.detailBosda?.length > 0) upload.detailBosda.forEach(item => { jumlahFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); });
                        if (upload.detailSpp?.length > 0) upload.detailSpp.forEach(item => { jumlahFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); });
                        if (upload.detailBeasiswaCerdas?.length > 0) upload.detailBeasiswaCerdas.forEach(item => { jumlahFisik += Number(item.jumlahSiswa) || 0; });
                        if (upload.detailBeasiswaMiskin?.length > 0) upload.detailBeasiswaMiskin.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
                        if (upload.detailPrakerin?.length > 0) upload.detailPrakerin.forEach(item => { jumlahFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); });
                        if (upload.detailVokasi?.length > 0) upload.detailVokasi.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
                        if (upload.detailCareer?.length > 0) upload.detailCareer.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
                        if (upload.detailIplm?.length > 0) upload.detailIplm.forEach(item => { jumlahFisik += Number(item.jumlahOrang) || 0; });

                        let uangLaporan = 0;
                        const sumNominal = (items) => { if (!items) return; items.forEach(item => { const n = item.nominal ? Number(item.nominal.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };
                        const sumRealisasi = (items) => { if (!items) return; items.forEach(item => { const n = item.realisasi ? Number(item.realisasi.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };
                        const sumRealisasiRupiah = (items) => { if (!items) return; items.forEach(item => { const n = item.realisasiRupiah ? Number(item.realisasiRupiah.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };

                        sumNominal(upload.detailBeasiswa);
                        sumNominal(upload.detailBosda);
                        sumNominal(upload.detailSpp);
                        sumNominal(upload.detailSeragam);
                        sumNominal(upload.detailIplm);
                        sumRealisasi(upload.detailDigital);
                        sumRealisasi(upload.detailBeasiswaCerdas);
                        sumRealisasiRupiah(upload.detailBeasiswaMiskin);
                        sumRealisasiRupiah(upload.detailVokasi);
                        sumRealisasiRupiah(upload.detailCareer); // Career pakai realisasiRupiah

                        if (upload.detailPrakerin?.length > 0) {
                            upload.detailPrakerin.forEach(item => {
                                const n = item.realisasiNegeri ? Number(item.realisasiNegeri.toString()) : 0;
                                const s = item.realisasiSwasta ? Number(item.realisasiSwasta.toString()) : 0;
                                uangLaporan += (isNaN(n) ? 0 : n) + (isNaN(s) ? 0 : s);
                            });
                        }

                        if (upload.statusVerifikasi === 'Disetujui') { totalDisetujuiFisik += jumlahFisik; totalUangRealisasi += uangLaporan; }
                        else if (upload.statusVerifikasi === 'Menunggu') { totalMenungguFisik += jumlahFisik; }
                    });

                    const persentaseFisik = targetFisik > 0 ? (totalDisetujuiFisik / targetFisik) * 100 : 0;
                    const persentaseKeuangan = paguAnggaran > 0 ? (totalUangRealisasi / paguAnggaran) * 100 : 0;
                    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

                    return {
                        id: sub.id, "Nama Sub Program": sub.namaSubProgram,
                        "Target Fisik": targetFisik, "Realisasi Fisik": totalDisetujuiFisik,
                        "Pending Fisik": totalMenungguFisik,
                        "Capaian Fisik": `${persentaseFisik.toFixed(2)}%`,
                        "Pagu Anggaran": formatRupiah(paguAnggaran),
                        "Realisasi Anggaran": formatRupiah(totalUangRealisasi),
                        "Sisa Anggaran": formatRupiah(paguAnggaran - totalUangRealisasi),
                        "Serapan Anggaran": `${persentaseKeuangan.toFixed(2)}%`,
                    };
                })
            }));

            res.json({ status: "success", msg: "Data Monitoring Realisasi", tahun, data: monitoringData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    },

    getMonitoringDetail: async (req, res) => {
        try {
            const { programSlug, subProgramSlug } = req.params;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();

            const subProgram = await prisma.subProgramKerja.findFirst({
                where: { slug: subProgramSlug, programKerja: { slug: programSlug } },
                include: { programKerja: true }
            });
            if (!subProgram) return res.status(404).json({ msg: "Data Sub Program tidak ditemukan." });

            const subProgramId = subProgram.id;
            const nameLower = subProgram.namaSubProgram.toLowerCase();
            const baseWhere = { header: { subProgramId, statusVerifikasi: 'Disetujui', tahun } };

            let data = [], type = "", totalFisik = 0;
            const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
            const getNominal = (val) => val ? Number(val.toString()) : 0;

            if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
                type = "bosda";
                const raw = await prisma.realisasiBosda.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); totalFisik += s; return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "SMA Negeri": `${item.smaNegeri || 0} Sekolah`, "SMA Swasta": `${item.smaSwasta || 0} Sekolah`, "SMK": `${item.smk || 0} Sekolah`, "SLB Negeri": `${item.slbNegeri || 0} Sekolah`, "SLB Swasta": `${item.slbSwasta || 0} Sekolah`, "Total Sekolah": s, "Nominal Bantuan": formatRupiah(getNominal(item.nominal)) }; });

            } else if (nameLower.includes('spp')) {
                type = "spp";
                const raw = await prisma.realisasiSpp.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); totalFisik += s; return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "Siswa SMA": `${item.siswaSma || 0} Siswa`, "Realisasi SMA": formatRupiah(getNominal(item.realisasiSma)), "Siswa SMK": `${item.siswaSmk || 0} Siswa`, "Realisasi SMK": formatRupiah(getNominal(item.realisasiSmk)), "Siswa SLB": `${item.siswaSlb || 0} Siswa`, "Realisasi SLB": formatRupiah(getNominal(item.realisasiSlb)), "Total Siswa": s, "Total Nominal": formatRupiah(getNominal(item.nominal)) }; });

            } else if (nameLower.includes('cerdas') || nameLower.includes('bakat istimewa') || nameLower.includes('smanor')) {
                type = "beasiswa-cerdas";
                const raw = await prisma.realisasiBeasiswaCerdas.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.jumlahSiswa) || 0; return { id: item.id, "Bidang": item.bidang, "Jumlah Siswa": item.jumlahSiswa, "Total Pagu": formatRupiah(Number(item.totalPagu)), "Realisasi": formatRupiah(getNominal(item.realisasi)), "Sisa": formatRupiah(getNominal(item.sisa)) }; });

            } else if (nameLower.includes('penyelesaian studi') || (nameLower.includes('miskin') && nameLower.includes('aktif'))) {
                type = "beasiswa-miskin";
                const raw = await prisma.realisasiBeasiswaMiskin.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Rincian Kegiatan": item.rincianKegiatan, "Kabupaten": item.kabupaten || '-', "Target Kinerja": item.targetKinerja, "Target Rupiah": formatRupiah(Number(item.targetRupiah)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Rupiah": formatRupiah(getNominal(item.realisasiRupiah)), "Capaian Kinerja": item.capaianKinerja, "Capaian Rupiah": item.capaianRupiah || '-' }; });

            } else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
                type = "prakerin";
                const raw = await prisma.realisasiPrakerin.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); totalFisik += s; const uN = getNominal(item.realisasiNegeri); const uS = getNominal(item.realisasiSwasta); return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "SMK Negeri": `${item.smkNegeri || 0} Siswa`, "Realisasi Negeri": formatRupiah(uN), "SMK Swasta": `${item.smkSwasta || 0} Siswa`, "Realisasi Swasta": formatRupiah(uS), "Nominal Total": formatRupiah(uN + uS) }; });

            } else if (nameLower.includes('digital') || nameLower.includes('sarana')) {
                type = "digital";
                const raw = await prisma.realisasiDigital.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.jumlahSekolah) || 0; return { id: item.id, "Bidang": item.bidang, "Jumlah Sekolah": item.jumlahSekolah, "Jumlah Siswa": item.jumlahSiswa, "Total Pagu": formatRupiah(Number(item.totalPagu)), "Realisasi": formatRupiah(getNominal(item.realisasi)), "Sisa": formatRupiah(getNominal(item.sisa)) }; });

            } else if (nameLower.includes('vokasi') || nameLower.includes('siap kerja')) {
                type = "vokasi";
                const raw = await prisma.realisasiVokasi.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Rincian Kegiatan": item.rincianKegiatan, "Kabupaten / Kota": item.kabupatenKota || '-', "Satuan": item.satuan || '-', "Target Kinerja": item.targetKinerja, "Target Rupiah": formatRupiah(Number(item.targetRupiah)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Rupiah": formatRupiah(getNominal(item.realisasiRupiah)), "Capaian Kinerja": item.capaianKinerja || '-', "Capaian Rupiah": item.capaianRupiah || '-' }; });

            } else if (nameLower.includes('career') || nameLower.includes('karir')) {
                type = "career";
                const raw = await prisma.realisasiCareerCenter.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => {
                    totalFisik += Number(item.realisasiKinerja) || 0;
                    return {
                        id: item.id,
                        "Nama Kegiatan": item.namaKegiatan,
                        "Lokasi": item.lokasi || '-',
                        "Kabupaten / Kota": item.kabupatenKota || '-',
                        "Target Kinerja": item.targetKinerja,
                        "Target Rupiah": formatRupiah(Number(item.targetRupiah)),
                        "Realisasi Kinerja": item.realisasiKinerja,
                        "Realisasi Rupiah": formatRupiah(getNominal(item.realisasiRupiah)),
                        "Capaian Kinerja": item.capaianKinerja || '-',
                        "Capaian Rupiah": item.capaianRupiah || '-',
                    };
                });

            } else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
                type = "iplm";
                const raw = await prisma.realisasiIplm.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const jml = Number(item.jumlahOrang) || 0; totalFisik += jml; return { id: item.id, "Nama Kegiatan": item.namaKegiatan, "Lokasi Kegiatan": item.lokasi || '-', "Jumlah Orang": `${jml} Orang`, "Kabupaten / Kota": item.kabupatenKota, "Nominal Bantuan": formatRupiah(getNominal(item.nominal)) }; });

            } else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
                type = "seragam";
                const raw = await prisma.realisasiSeragam.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                totalFisik = raw.length;
                data = raw.map(item => ({ id: item.id, "Nama Sekolah": item.namaSekolah, "Jumlah Siswa": `${item.jumlahSiswa} Siswa`, "Kabupaten / Kota": item.kabupatenKota, "Nominal Bantuan": formatRupiah(getNominal(item.nominal)) }));

            } else if (nameLower.includes('beasiswa')) {
                type = "beasiswa";
                const raw = await prisma.realisasiBeasiswa.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                totalFisik = raw.length;
                data = raw.map(item => ({ id: item.id, "Nama Penerima": item.namaPenerima, "NIK": item.nik || '-', "NIM": item.nim || '-', "Program Studi": item.programStudi || '-', "Institusi Tujuan": item.institusiTujuan, "Kabupaten / Kota": item.kabupaten, "Alamat Lengkap": item.alamat || '-', "Jalur Pendaftaran": item.jalur || '-', "Nominal Bantuan": formatRupiah(getNominal(item.nominal)), "Kontak Penerima": item.kontakPenerima || '-' }));

            } else {
                return res.json({ status: "success", msg: "Belum ada data detail untuk tipe sub program ini.", program: subProgram.programKerja.namaProgram, subProgram: subProgram.namaSubProgram, tahun, data: [] });
            }

            res.json({ status: "success", program: subProgram.programKerja.namaProgram, programSlug: subProgram.programKerja.slug, subProgram: subProgram.namaSubProgram, subProgramSlug: subProgram.slug, tahun, type, totalData: totalFisik, data });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: error.message });
        }
    }
};

export default monitoringController;