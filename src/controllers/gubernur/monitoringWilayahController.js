import prisma from '../../utils/prisma.js';

const monitoringWilayahController = {
    getMonitoringWilayah: async (req, res) => {
        try {
            const tahun = Number(req.query.tahun) || new Date().getFullYear();
            const allPrograms = await prisma.programKerja.findMany({ include: { subProgram: { include: { targetTahunan: { where: { tahun } } } } }, orderBy: { id: 'asc' } });

            const paguProgram = {};
            let totalAnggaranProvinsi = 0;
            const rekapProvinsi = { totalPenerima: 0, totalRealisasi: 0, programs: {} };
            allPrograms.forEach(p => { let total = 0; p.subProgram.forEach(sub => { const t = sub.targetTahunan[0]; total += t?.anggaran ? Number(t.anggaran) : 0; }); paguProgram[p.namaProgram] = total; totalAnggaranProvinsi += total; rekapProvinsi.programs[p.namaProgram] = { totalPenerima: 0, totalRealisasi: 0 }; });

            const allRealisasi = await prisma.dataRealisasi.findMany({
                where: { statusVerifikasi: 'Disetujui', tahun },
                include: {
                    subProgram: { include: { programKerja: true } },
                    detailBosda: true, detailSpp: true, detailBeasiswaCerdas: true, detailBeasiswaMiskin: true,
                    detailPrakerin: true, detailDigital: true, detailVokasi: true, detailCareer: true,
                    detailIplm: true, detailSeragam: true, detailBeasiswa: true,
                    detailPemeriksaanGratis: true, detailNasehaKami: true,
                    detailRsRujukan: true, detailStunting: true, detailKualitasRs: true,
                    detailJaminanHarga: true, detailPanada: true, detailUep: true,
                    detailRutilahu: true, detailUmkm: true, detailMbg: true,
                    detailAksesListrik: true, detailInternetDesa: true,
                }
            });

            const cleanName = (name) => {
                if (!name) return 'LAINNYA';
                // Ambil bagian pertama sebelum koma (misal: "Kota Palu, Kecamatan Tatanga" → "Kota Palu")
                let c = name.toString().split(',')[0].trim().toUpperCase();
                c = c.replace(/^KAB\.\s*/, '').replace(/^KABUPATEN\s*/, '').replace(/^KOTA\s*/, '').trim();
                if (c === 'TOUNA' || c === 'TOJO UNA-UNA' || c === 'TOJO UNAUNA') c = 'TOJO UNA UNA';
                if (c === 'TOLITOLI' || c === 'TOLI-TOLI') c = 'TOLI TOLI';
                if (c === 'BANGGAI KEPUALUAN') c = 'BANGGAI KEPULAUAN';
                // Normalisasi alias umum
                if (c === 'PARIGI' || c === 'PARIMO') c = 'PARIGI MOUTONG';
                return c;
            };
            const DISPLAY_WILAYAH = { "BANGGAI": "Kabupaten Banggai", "BANGGAI KEPULAUAN": "Kabupaten Banggai Kepulauan", "BANGGAI LAUT": "Kabupaten Banggai Laut", "BUOL": "Kabupaten Buol", "DONGGALA": "Kabupaten Donggala", "MOROWALI": "Kabupaten Morowali", "MOROWALI UTARA": "Kabupaten Morowali Utara", "PARIGI MOUTONG": "Kabupaten Parigi Moutong", "POSO": "Kabupaten Poso", "SIGI": "Kabupaten Sigi", "TOJO UNA UNA": "Kabupaten Tojo Una Una", "TOLI TOLI": "Kabupaten Toli Toli", "PALU": "Kota Palu", "LAINNYA": "Lainnya" };
            const mapWilayah = {};
            Object.keys(DISPLAY_WILAYAH).filter(k => k !== "LAINNYA").forEach(w => { mapWilayah[w] = { namaKabupaten: w, totalPenerima: 0, totalRealisasi: 0, programs: {} }; });

            const processItem = (kabupaten, nominal, jumlahPenerima, namaProgram) => {
                const namaKota = cleanName(kabupaten); const uang = Number(nominal) || 0; const penerima = Number(jumlahPenerima) || 0;
                rekapProvinsi.totalPenerima += penerima; rekapProvinsi.totalRealisasi += uang;
                if (rekapProvinsi.programs[namaProgram]) { rekapProvinsi.programs[namaProgram].totalPenerima += penerima; rekapProvinsi.programs[namaProgram].totalRealisasi += uang; }
                const targetKota = mapWilayah[namaKota] ? namaKota : 'LAINNYA';
                if (!mapWilayah[targetKota]) mapWilayah[targetKota] = { namaKabupaten: targetKota, totalPenerima: 0, totalRealisasi: 0, programs: {} };
                mapWilayah[targetKota].totalPenerima += penerima; mapWilayah[targetKota].totalRealisasi += uang;
                if (!mapWilayah[targetKota].programs[namaProgram]) mapWilayah[targetKota].programs[namaProgram] = { totalPenerima: 0, totalRealisasi: 0 };
                mapWilayah[targetKota].programs[namaProgram].totalPenerima += penerima; mapWilayah[targetKota].programs[namaProgram].totalRealisasi += uang;
            };

            const parseNominal = (val) => val ? Number(val.toString()) : 0;

            allRealisasi.forEach(header => {
                const prog = header.subProgram?.programKerja?.namaProgram || 'Tanpa Program';
                const processDetailArray = (arr, fieldKab) => arr?.forEach(item => processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), 1, prog));
                const processBosdaArray = (arr, fieldKab) => arr?.forEach(item => { const jml = (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), jml, prog); });
                const processSppArray = (arr, fieldKab) => arr?.forEach(item => { const jml = (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); processItem(item[fieldKab] || 'Lainnya', parseNominal(item.nominal), jml, prog); });
                const processPrakerinArray = (arr, fieldKab) => arr?.forEach(item => { const jml = (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); processItem(item[fieldKab] || 'Lainnya', parseNominal(item.realisasiNegeri) + parseNominal(item.realisasiSwasta), jml, prog); });

                processBosdaArray(header.detailBosda, 'kabupatenKota');
                processSppArray(header.detailSpp, 'kabupatenKota');
                header.detailBeasiswaCerdas?.forEach(item => processItem('Lainnya', parseNominal(item.realisasi), Number(item.jumlahSiswa) || 0, prog));
                header.detailBeasiswaMiskin?.forEach(item => processItem(item.kabupaten || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                processPrakerinArray(header.detailPrakerin, 'kabupatenKota');
                header.detailDigital?.forEach(item => processItem('Lainnya', parseNominal(item.realisasi), Number(item.jumlahSekolah) || 0, prog));
                header.detailVokasi?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailCareer?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailIplm?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                processDetailArray(header.detailSeragam, 'kabupatenKota');
                processDetailArray(header.detailBeasiswa, 'kabupaten');
                // Berani Sehat
                header.detailPemeriksaanGratis?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), 1, prog));
                header.detailNasehaKami?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), 1, prog));
                header.detailRsRujukan?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), 1, prog));
                header.detailStunting?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), 1, prog));
                header.detailKualitasRs?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), 1, prog));
                // Berani Sejahtera
                header.detailJaminanHarga?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailPanada?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailUep?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailRutilahu?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailUmkm?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailMbg?.forEach(item => processItem('Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                // Berani Menyala
                header.detailAksesListrik?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
                header.detailInternetDesa?.forEach(item => processItem(item.kabupatenKota || 'Lainnya', parseNominal(item.realisasiAnggaran), Number(item.realisasiKinerja) || 0, prog));
            });

            const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
            const buildProgramList = (programsData) => allPrograms.map(prog => { const pd = programsData[prog.namaProgram]; const r = pd?.totalRealisasi ?? 0, p = pd?.totalPenerima ?? 0; const a = paguProgram[prog.namaProgram] || 0; const persen = a > 0 ? (r / a) * 100 : 0; const persenD = Number(persen.toFixed(3)); return { namaProgram: prog.namaProgram, totalPenerima: p, anggaran: formatRupiah(a), totalRealisasi: formatRupiah(r), persentase: persenD, persentaseString: `${persenD.toString().replace('.', ',')}%` }; });

            const persenProv = totalAnggaranProvinsi > 0 ? (rekapProvinsi.totalRealisasi / totalAnggaranProvinsi) * 100 : 0;
            const persenProvD = Number(persenProv.toFixed(3));
            const dataProvinsi = { namaKabupaten: "SULAWESI TENGAH (TOTAL PROVINSI)", totalPenerima: rekapProvinsi.totalPenerima, totalRealisasi: formatRupiah(rekapProvinsi.totalRealisasi), persentaseTotal: persenProvD, persentaseTotalString: `${persenProvD.toString().replace('.', ',')}%`, detailProgram: buildProgramList(rekapProvinsi.programs) };

            let finalData = Object.keys(mapWilayah).map(rawName => { const kota = mapWilayah[rawName]; const persen = totalAnggaranProvinsi > 0 ? (kota.totalRealisasi / totalAnggaranProvinsi) * 100 : 0; const persenD = Number(persen.toFixed(3)); return { namaKabupaten: DISPLAY_WILAYAH[rawName] || rawName, totalPenerima: kota.totalPenerima, totalRealisasi: formatRupiah(kota.totalRealisasi), persentaseTotal: persenD, persentaseTotalString: `${persenD.toString().replace('.', ',')}%`, detailProgram: buildProgramList(kota.programs) }; });
            const URUTAN_RESMI = Object.values(DISPLAY_WILAYAH).filter(v => v !== 'Lainnya');
            finalData.sort((a, b) => {
                const idxA = URUTAN_RESMI.indexOf(a.namaKabupaten);
                const idxB = URUTAN_RESMI.indexOf(b.namaKabupaten);
                const isLainnyaA = idxA === -1;
                const isLainnyaB = idxB === -1;
                if (!isLainnyaA && !isLainnyaB) return idxA - idxB;
                if (!isLainnyaA) return -1;
                if (!isLainnyaB) return 1;
                return a.namaKabupaten.localeCompare(b.namaKabupaten);
            });
            finalData.unshift(dataProvinsi);

            res.json({ status: "success", msg: "Data Monitoring Sebaran Wilayah", tahun, data: finalData });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    }
};

export default monitoringWilayahController;