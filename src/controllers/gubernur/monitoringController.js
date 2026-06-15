import prisma from '../../utils/prisma.js';

const parseNominal = (val) => val ? Number(val.toString()) : 0;
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

const INCLUDE_SEHAT = {
    detailPemeriksaanGratis: true, detailNasehaKami: true,
    detailRsRujukan: true, detailStunting: true, detailKualitasRs: true,
};

const INCLUDE_MENYALA = {
    detailAksesListrik: true,
    detailInternetDesa: true,
};

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
                                    ...INCLUDE_SEHAT, ...INCLUDE_MENYALA,
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
                        if (upload.detailIplm?.length > 0) upload.detailIplm.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
                        // Berani Sehat + Menyala
                        const sehatMenyalaArrays = [upload.detailPemeriksaanGratis, upload.detailNasehaKami, upload.detailRsRujukan, upload.detailStunting, upload.detailKualitasRs, upload.detailAksesListrik, upload.detailInternetDesa];
                        // Berani Sehat: realisasiKinerja bisa desimal (%) → hitung 1 per baris
                        // Berani Menyala: realisasiKinerja adalah jumlah unit → pakai nilai aslinya
                        const sehatArrays = [upload.detailPemeriksaanGratis, upload.detailNasehaKami, upload.detailRsRujukan, upload.detailStunting, upload.detailKualitasRs];
                        const menyalaArrays = [upload.detailAksesListrik, upload.detailInternetDesa];
                        sehatArrays.forEach(arr => { jumlahFisik += arr?.length || 0; });
                        menyalaArrays.forEach(arr => { arr?.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; }); });

                        let uangLaporan = 0;
                        const sumNominal = (items) => { if (!items) return; items.forEach(item => { const n = item.nominal ? Number(item.nominal.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };
                        const sumRealisasi = (items) => { if (!items) return; items.forEach(item => { const n = item.realisasi ? Number(item.realisasi.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };
                        const sumRealisasiAnggaran = (items) => { if (!items) return; items.forEach(item => { const n = item.realisasiAnggaran ? Number(item.realisasiAnggaran.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); };

                        sumNominal(upload.detailBeasiswa); sumNominal(upload.detailBosda); sumNominal(upload.detailSpp); sumNominal(upload.detailSeragam);
                        sumRealisasi(upload.detailDigital); sumRealisasi(upload.detailBeasiswaCerdas);
                        sumRealisasiAnggaran(upload.detailBeasiswaMiskin); sumRealisasiAnggaran(upload.detailVokasi); sumRealisasiAnggaran(upload.detailCareer); sumRealisasiAnggaran(upload.detailIplm);
                        if (upload.detailPrakerin?.length > 0) { upload.detailPrakerin.forEach(item => { const n = item.realisasiNegeri ? Number(item.realisasiNegeri.toString()) : 0; const s = item.realisasiSwasta ? Number(item.realisasiSwasta.toString()) : 0; uangLaporan += (isNaN(n) ? 0 : n) + (isNaN(s) ? 0 : s); }); }
                        [...sehatArrays, ...menyalaArrays].forEach(arr => { arr?.forEach(item => { const n = item.realisasiAnggaran ? Number(item.realisasiAnggaran.toString()) : 0; uangLaporan += isNaN(n) ? 0 : n; }); });

                        if (upload.statusVerifikasi === 'Disetujui') { totalDisetujuiFisik += jumlahFisik; totalUangRealisasi += uangLaporan; }
                        else if (upload.statusVerifikasi === 'Menunggu') { totalMenungguFisik += jumlahFisik; }
                    });

                    const persentaseFisik = targetFisik > 0 ? (totalDisetujuiFisik / targetFisik) * 100 : 0;
                    const persentaseKeuangan = paguAnggaran > 0 ? (totalUangRealisasi / paguAnggaran) * 100 : 0;
                    return {
                        id: sub.id, "Nama Sub Program": sub.namaSubProgram,
                        "Target Fisik": targetFisik, "Realisasi Fisik": totalDisetujuiFisik,
                        "Pending Fisik": totalMenungguFisik,
                        "Capaian Fisik": `${persentaseFisik.toFixed(2)}%`,
                        "Pagu Anggaran": formatRp(paguAnggaran),
                        "Realisasi Anggaran": formatRp(totalUangRealisasi),
                        "Sisa Anggaran": formatRp(paguAnggaran - totalUangRealisasi),
                        "Serapan Anggaran": `${persentaseKeuangan.toFixed(2)}%`,
                    };
                })
            }));

            res.json({ status: "success", msg: "Data Monitoring Realisasi", tahun, data: monitoringData });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
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
            const getNominal = (val) => val ? Number(val.toString()) : 0;

            // Helper untuk model dengan format Anggaran (Sehat & Menyala)
            const mapAnggaran = (raw, namaField = 'rincianKegiatan') => raw.map(item => {
                totalFisik += Number(item.realisasiKinerja) || 0;
                const label = item[namaField] || item.namaProgram || item.program || '-';
                const labelKey = namaField === 'namaProgram' ? "Nama Program"
                    : namaField === 'program' ? "Program"
                        : "Rincian Kegiatan";
                return {
                    id: item.id,
                    [labelKey]: label,
                    ...(item.kabupatenKota !== undefined && { "Kabupaten / Kota": item.kabupatenKota || '-' }),
                    "Satuan": item.satuan || '-',
                    "Target Kinerja": item.targetKinerja,
                    "Target Anggaran": formatRp(Number(item.targetAnggaran)),
                    "Realisasi Kinerja": item.realisasiKinerja,
                    "Realisasi Anggaran": formatRp(getNominal(item.realisasiAnggaran)),
                    "Capaian Kinerja (%)": item.capaianKinerja || '-',
                    "Capaian Anggaran (%)": item.capaianAnggaran || '-',
                };
            });

            // ===== BERANI CERDAS =====
            if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
                type = "bosda";
                const raw = await prisma.realisasiBosda.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); totalFisik += s; return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "SMA Negeri": `${item.smaNegeri || 0} Sekolah`, "SMA Swasta": `${item.smaSwasta || 0} Sekolah`, "SMK": `${item.smk || 0} Sekolah`, "SLB Negeri": `${item.slbNegeri || 0} Sekolah`, "SLB Swasta": `${item.slbSwasta || 0} Sekolah`, "Total Sekolah": s, "Nominal Bantuan": formatRp(getNominal(item.nominal)) }; });
            } else if (nameLower.includes('spp')) {
                type = "spp";
                const raw = await prisma.realisasiSpp.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); totalFisik += s; return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "Siswa SMA": `${item.siswaSma || 0} Siswa`, "Realisasi SMA": formatRp(getNominal(item.realisasiSma)), "Siswa SMK": `${item.siswaSmk || 0} Siswa`, "Realisasi SMK": formatRp(getNominal(item.realisasiSmk)), "Siswa SLB": `${item.siswaSlb || 0} Siswa`, "Realisasi SLB": formatRp(getNominal(item.realisasiSlb)), "Total Siswa": s, "Total Nominal": formatRp(getNominal(item.nominal)) }; });
            } else if (nameLower.includes('cerdas') || nameLower.includes('bakat istimewa') || nameLower.includes('smanor')) {
                type = "beasiswa-cerdas";
                const raw = await prisma.realisasiBeasiswaCerdas.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.jumlahSiswa) || 0; return { id: item.id, "Bidang": item.bidang, "Jumlah Siswa": item.jumlahSiswa, "Total Pagu": formatRp(Number(item.totalPagu)), "Realisasi": formatRp(getNominal(item.realisasi)), "Sisa": formatRp(getNominal(item.sisa)) }; });
            } else if (nameLower.includes('penyelesaian studi') || (nameLower.includes('miskin') && nameLower.includes('aktif'))) {
                type = "beasiswa-miskin";
                const raw = await prisma.realisasiBeasiswaMiskin.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Rincian Kegiatan": item.rincianKegiatan, "Kabupaten": item.kabupaten || '-', "Target Kinerja": item.targetKinerja, "Target Anggaran": formatRp(Number(item.targetAnggaran)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Anggaran": formatRp(getNominal(item.realisasiAnggaran)), "Capaian Kinerja (%)": item.capaianKinerja, "Capaian Anggaran (%)": item.capaianAnggaran || '-' }; });
            } else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
                type = "prakerin";
                const raw = await prisma.realisasiPrakerin.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { const s = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); totalFisik += s; const uN = getNominal(item.realisasiNegeri); const uS = getNominal(item.realisasiSwasta); return { id: item.id, "Kabupaten / Kota": item.kabupatenKota, "SMK Negeri": `${item.smkNegeri || 0} Siswa`, "Realisasi Negeri": formatRp(uN), "SMK Swasta": `${item.smkSwasta || 0} Siswa`, "Realisasi Swasta": formatRp(uS), "Nominal Total": formatRp(uN + uS) }; });
            } else if (nameLower.includes('digital') || nameLower.includes('sarana')) {
                type = "digital";
                const raw = await prisma.realisasiDigital.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.jumlahSekolah) || 0; return { id: item.id, "Bidang": item.bidang, "Jumlah Sekolah": item.jumlahSekolah, "Jumlah Siswa": item.jumlahSiswa, "Total Pagu": formatRp(Number(item.totalPagu)), "Realisasi": formatRp(getNominal(item.realisasi)), "Sisa": formatRp(getNominal(item.sisa)) }; });
            } else if (nameLower.includes('vokasi') || nameLower.includes('siap kerja')) {
                type = "vokasi";
                const raw = await prisma.realisasiVokasi.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Rincian Kegiatan": item.rincianKegiatan, "Kabupaten / Kota": item.kabupatenKota || '-', "Satuan": item.satuan || '-', "Target Kinerja": item.targetKinerja, "Target Anggaran": formatRp(Number(item.targetAnggaran)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Anggaran": formatRp(getNominal(item.realisasiAnggaran)), "Capaian Kinerja (%)": item.capaianKinerja || '-', "Capaian Anggaran (%)": item.capaianAnggaran || '-' }; });
            } else if (nameLower.includes('career') || nameLower.includes('karir')) {
                type = "career";
                const raw = await prisma.realisasiCareerCenter.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Nama Kegiatan": item.namaKegiatan, "Lokasi": item.lokasi || '-', "Kabupaten / Kota": item.kabupatenKota || '-', "Target Kinerja": item.targetKinerja, "Target Anggaran": formatRp(Number(item.targetAnggaran)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Anggaran": formatRp(getNominal(item.realisasiAnggaran)), "Capaian Kinerja (%)": item.capaianKinerja || '-', "Capaian Anggaran (%)": item.capaianAnggaran || '-' }; });
            } else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
                type = "iplm";
                const raw = await prisma.realisasiIplm.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = raw.map(item => { totalFisik += Number(item.realisasiKinerja) || 0; return { id: item.id, "Rincian Kegiatan": item.rincianKegiatan, "Satuan": item.satuan || '-', "Target Kinerja": item.targetKinerja, "Target Anggaran": formatRp(Number(item.targetAnggaran)), "Realisasi Kinerja": item.realisasiKinerja, "Realisasi Anggaran": formatRp(getNominal(item.realisasiAnggaran)), "Capaian Kinerja (%)": item.capaianKinerja || '-', "Capaian Anggaran (%)": item.capaianAnggaran || '-' }; });
            } else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
                type = "seragam";
                const raw = await prisma.realisasiSeragam.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                totalFisik = raw.length;
                data = raw.map(item => ({ id: item.id, "Nama Sekolah": item.namaSekolah, "Jumlah Siswa": `${item.jumlahSiswa} Siswa`, "Kabupaten / Kota": item.kabupatenKota, "Nominal Bantuan": formatRp(getNominal(item.nominal)) }));
            } else if (nameLower.includes('beasiswa')) {
                type = "beasiswa";
                const raw = await prisma.realisasiBeasiswa.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                totalFisik = raw.length;
                data = raw.map(item => ({ id: item.id, "Nama Penerima": item.namaPenerima, "NIK": item.nik || '-', "NIM": item.nim || '-', "Program Studi": item.programStudi || '-', "Institusi Tujuan": item.institusiTujuan, "Kabupaten / Kota": item.kabupaten, "Alamat Lengkap": item.alamat || '-', "Jalur Pendaftaran": item.jalur || '-', "Nominal Bantuan": formatRp(getNominal(item.nominal)), "Kontak Penerima": item.kontakPenerima || '-' }));

                // ===== BERANI SEHAT =====
            } else if (nameLower.includes('pemeriksaan kesehatan gratis') || nameLower.includes('dukungan terhadap pelaksanaan')) {
                type = "pemeriksaan-gratis";
                const raw = await prisma.realisasiPemeriksaanGratis.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw);
            } else if (nameLower.includes('naseha') || nameLower.includes('jaminan layanan kesehatan')) {
                type = "naseha-kami";
                const raw = await prisma.realisasiNasehaKami.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw);
            } else if (nameLower.includes('rujukan') || nameLower.includes('internasional')) {
                type = "rs-rujukan";
                const raw = await prisma.realisasiRsRujukan.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw);
            } else if (nameLower.includes('stunting')) {
                type = "stunting";
                const raw = await prisma.realisasiStunting.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw, 'program');
            } else if (nameLower.includes('kualitas layanan') || (nameLower.includes('undata') && nameLower.includes('madani'))) {
                type = "kualitas-rs";
                const raw = await prisma.realisasiKualitasRs.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw);

                // ===== BERANI MENYALA =====
            } else if (nameLower.includes('listrik') || nameLower.includes('penerangan') || nameLower.includes('lampu jalan')) {
                type = "akses-listrik";
                const raw = await prisma.realisasiAksesListrik.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw, 'namaProgram');
            } else if (nameLower.includes('internet') || nameLower.includes('blank spot') || nameLower.includes('jaringan')) {
                type = "internet-desa";
                const raw = await prisma.realisasiInternetDesa.findMany({ where: baseWhere, include: { header: true }, orderBy: { header: { tanggalVerifikasi: 'asc' } } });
                data = mapAnggaran(raw, 'namaProgram');

            } else {
                return res.json({ status: "success", msg: "Belum ada data detail untuk tipe sub program ini.", program: subProgram.programKerja.namaProgram, subProgram: subProgram.namaSubProgram, tahun, data: [] });
            }

            res.json({ status: "success", program: subProgram.programKerja.namaProgram, programSlug: subProgram.programKerja.slug, subProgram: subProgram.namaSubProgram, subProgramSlug: subProgram.slug, tahun, type, totalData: totalFisik, data });

        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    }
};

export default monitoringController;