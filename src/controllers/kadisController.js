import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';

const parseNom = (val) => val ? Number(val.toString()) : 0;

const sumNominal = (items) => { if (!items) return 0; return items.reduce((acc, curr) => { const n = curr.nominal ? Number(curr.nominal.toString()) : 0; return acc + (isNaN(n) ? 0 : n); }, 0); };
const sumRealisasi = (items) => { if (!items) return 0; return items.reduce((acc, curr) => { const n = curr.realisasi ? Number(curr.realisasi.toString()) : 0; return acc + (isNaN(n) ? 0 : n); }, 0); };
const sumRealisasiAnggaran = (items) => { if (!items) return 0; return items.reduce((acc, curr) => { const n = curr.realisasiAnggaran ? Number(curr.realisasiAnggaran.toString()) : 0; return acc + (isNaN(n) ? 0 : n); }, 0); };
const sumPrakerin = (items) => { if (!items) return 0; return items.reduce((acc, curr) => { const n = curr.realisasiNegeri ? Number(curr.realisasiNegeri.toString()) : 0; const s = curr.realisasiSwasta ? Number(curr.realisasiSwasta.toString()) : 0; return acc + (isNaN(n) ? 0 : n) + (isNaN(s) ? 0 : s); }, 0); };

const INCLUDE_ALL = {
    detailBosda: true, detailSpp: true,
    detailBeasiswaCerdas: true, detailBeasiswaMiskin: true,
    detailPrakerin: true, detailDigital: true,
    detailVokasi: true, detailCareer: true,
    detailIplm: true, detailSeragam: true, detailBeasiswa: true,
    detailPemeriksaanGratis: true, detailNasehaKami: true,
    detailRsRujukan: true, detailStunting: true, detailKualitasRs: true,
    detailJaminanHarga: true, detailPanada: true, detailUep: true,
    detailRutilahu: true, detailUmkm: true, detailMbg: true,
    detailGaspoll: true, detailSpbe: true, detailBudayaKerja: true, detailBantuanKeuangan: true,
    detailAksesListrik: true, detailInternetDesa: true,
};

const hitungFisikDanUang = (upload) => {
    let jumlahFisik = 0;
    jumlahFisik += upload.detailBeasiswa?.length || 0;
    jumlahFisik += upload.detailSeragam?.length || 0;
    if (upload.detailDigital?.length) upload.detailDigital.forEach(item => { jumlahFisik += Number(item.jumlahSekolah) || 0; });
    if (upload.detailBosda?.length) upload.detailBosda.forEach(item => { jumlahFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); });
    if (upload.detailSpp?.length) upload.detailSpp.forEach(item => { jumlahFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); });
    if (upload.detailBeasiswaCerdas?.length) upload.detailBeasiswaCerdas.forEach(item => { jumlahFisik += Number(item.jumlahSiswa) || 0; });
    if (upload.detailBeasiswaMiskin?.length) upload.detailBeasiswaMiskin.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
    if (upload.detailPrakerin?.length) upload.detailPrakerin.forEach(item => { jumlahFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); });
    if (upload.detailVokasi?.length) upload.detailVokasi.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
    if (upload.detailCareer?.length) upload.detailCareer.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
    if (upload.detailIplm?.length) upload.detailIplm.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; });
    const sehatArrays = [upload.detailPemeriksaanGratis, upload.detailNasehaKami, upload.detailRsRujukan, upload.detailStunting, upload.detailKualitasRs];
    const sejahteraArrays = [upload.detailJaminanHarga, upload.detailPanada, upload.detailUep, upload.detailRutilahu, upload.detailUmkm, upload.detailMbg];
    const menyalaArrays = [upload.detailAksesListrik, upload.detailInternetDesa];
    sehatArrays.forEach(arr => { jumlahFisik += arr?.length || 0; });
    sejahteraArrays.forEach(arr => { jumlahFisik += arr?.length || 0; });
    const integritasArrays = [upload.detailGaspoll, upload.detailSpbe, upload.detailBudayaKerja, upload.detailBantuanKeuangan];
    integritasArrays.forEach(arr => { jumlahFisik += arr?.length || 0; });
    menyalaArrays.forEach(arr => { arr?.forEach(item => { jumlahFisik += Number(item.realisasiKinerja) || 0; }); });

    const totalUang =
        sumNominal(upload.detailBosda) + sumNominal(upload.detailSpp) +
        sumRealisasi(upload.detailBeasiswaCerdas) +
        sumRealisasiAnggaran(upload.detailBeasiswaMiskin) +
        sumPrakerin(upload.detailPrakerin) +
        sumRealisasi(upload.detailDigital) +
        sumRealisasiAnggaran(upload.detailVokasi) + sumRealisasiAnggaran(upload.detailCareer) +
        sumRealisasiAnggaran(upload.detailIplm) +
        sumNominal(upload.detailSeragam) + sumNominal(upload.detailBeasiswa) +
        sumRealisasiAnggaran(upload.detailPemeriksaanGratis) + sumRealisasiAnggaran(upload.detailNasehaKami) +
        sumRealisasiAnggaran(upload.detailRsRujukan) + sumRealisasiAnggaran(upload.detailStunting) +
        sumRealisasiAnggaran(upload.detailKualitasRs) +
        sumRealisasiAnggaran(upload.detailJaminanHarga) + sumRealisasiAnggaran(upload.detailPanada) +
        sumRealisasiAnggaran(upload.detailUep) + sumRealisasiAnggaran(upload.detailRutilahu) +
        sumRealisasiAnggaran(upload.detailUmkm) + sumRealisasiAnggaran(upload.detailMbg) +
        sumRealisasiAnggaran(upload.detailGaspoll) + sumRealisasiAnggaran(upload.detailSpbe) +
        sumRealisasiAnggaran(upload.detailBudayaKerja) + sumRealisasiAnggaran(upload.detailBantuanKeuangan) +
        sumRealisasiAnggaran(upload.detailAksesListrik) + sumRealisasiAnggaran(upload.detailInternetDesa);

    return { jumlahFisik, totalUang };
};

const kadisController = {

    getJobdesk: async (req, res) => {
        try {
            const userProgramId = req.user.programKerjaId;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();
            if (!userProgramId) return res.status(200).json({ status: "success", msg: "Anda belum ditugaskan ke Program Kerja manapun.", data: null });
            const programData = await prisma.programKerja.findUnique({
                where: { id: Number(userProgramId) },
                include: { subProgram: { orderBy: { id: 'asc' }, include: { targetTahunan: { where: { tahun } }, dataRealisasi: { where: { statusVerifikasi: 'Disetujui', tahun }, include: INCLUDE_ALL } } } }
            });
            if (!programData) return res.status(404).json({ msg: "Data Program Kerja tidak ditemukan." });
            const result = {
                programKerja: { id: programData.id, namaProgram: programData.namaProgram, slug: programData.slug, deskripsiProgram: programData.deskripsi },
                tahun,
                subPrograms: programData.subProgram.map(sub => {
                    const targetData = sub.targetTahunan[0];
                    const targetFisik = targetData?.target ?? 0;
                    const paguAnggaran = targetData?.anggaran ? Number(targetData.anggaran) : 0;
                    let totalDisetujuiFisik = 0, totalUangRealisasi = 0;
                    sub.dataRealisasi.forEach(upload => { const { jumlahFisik, totalUang } = hitungFisikDanUang(upload); totalDisetujuiFisik += jumlahFisik; totalUangRealisasi += totalUang; });
                    const persentaseFisik = targetFisik > 0 ? (totalDisetujuiFisik / targetFisik) * 100 : 0;
                    const persentaseAnggaran = paguAnggaran > 0 ? (totalUangRealisasi / paguAnggaran) * 100 : 0;
                    return { id: sub.id, namaSubProgram: sub.namaSubProgram, slug: sub.slug, target: targetFisik, anggaran: paguAnggaran.toString(), realisasiTarget: totalDisetujuiFisik, persentaseTarget: `${persentaseFisik.toFixed(2)}%`, realisasiAnggaran: totalUangRealisasi.toString(), persentaseAnggaran: `${persentaseAnggaran.toFixed(2)}%` };
                })
            };
            res.json({ status: "success", data: result });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    },

    getInboxVerifikasi: async (req, res) => {
        try {
            const { status } = req.query;
            const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;
            const { role, programKerjaId } = req.user;
            let whereClause = {};
            if (status) whereClause.statusVerifikasi = status;
            if (tahun) whereClause.tahun = tahun;
            if (role === 'Kepala Dinas') {
                if (!programKerjaId) return res.status(200).json({ status: "success", data: [], msg: "Belum ada program." });
                const subPrograms = await prisma.subProgramKerja.findMany({ where: { programKerjaId: Number(programKerjaId) }, select: { id: true } });
                whereClause.subProgramId = { in: subPrograms.map(sp => sp.id) };
            }
            const data = await prisma.dataRealisasi.findMany({ where: whereClause, orderBy: { tanggalInput: 'desc' }, include: { inputer: { select: { username: true, role: true, kontak: true } }, subProgram: { select: { namaSubProgram: true, slug: true } } } });
            res.json({ status: "success", data });
        } catch (error) { res.status(500).json({ msg: error.message }); }
    },

    approveLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, programKerjaId } = req.user;
            const headerData = await prisma.dataRealisasi.findUnique({ where: { id: Number(id) }, include: { subProgram: true } });
            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });
            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan dari Program Kerja Anda." });
            if (headerData.statusVerifikasi === 'Disetujui') return res.status(400).json({ msg: "Laporan ini sudah disetujui sebelumnya." });
            await prisma.dataRealisasi.update({ where: { id: Number(id) }, data: { statusVerifikasi: 'Disetujui', catatanRevisi: null, diVerifikasiOleh: req.user.id, tanggalVerifikasi: new Date() } });
            res.json({ status: "success", msg: "Laporan Berhasil Disetujui (ACC)" });
        } catch (error) { res.status(500).json({ msg: "Gagal menyetujui laporan", error: error.message }); }
    },

    rejectLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { catatan } = req.body;
            const { role, programKerjaId } = req.user;
            if (!catatan) return res.status(400).json({ msg: "Catatan penolakan wajib diisi!" });
            const headerData = await prisma.dataRealisasi.findUnique({ where: { id: Number(id) }, include: { subProgram: true } });
            if (!headerData) return res.status(404).json({ msg: "Data tidak ditemukan" });
            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan dari Program Kerja Anda." });
            if (headerData.statusVerifikasi === 'Ditolak') return res.status(400).json({ msg: "Laporan ini sudah ditolak sebelumnya." });
            await prisma.$transaction(async (tx) => {
                const models = [
                    'realisasiBosda', 'realisasiSpp', 'realisasiBeasiswaCerdas', 'realisasiBeasiswaMiskin',
                    'realisasiPrakerin', 'realisasiDigital', 'realisasiVokasi', 'realisasiCareerCenter',
                    'realisasiIplm', 'realisasiSeragam', 'realisasiBeasiswa',
                    'realisasiPemeriksaanGratis', 'realisasiNasehaKami', 'realisasiRsRujukan',
                    'realisasiStunting', 'realisasiKualitasRs',
                    'realisasiJaminanHarga', 'realisasiPanada', 'realisasiUep',
                    'realisasiRutilahu', 'realisasiUmkm', 'realisasiMbg',
                    'realisasiGaspoll', 'realisasiSpbe', 'realisasiBudayaKerja', 'realisasiBantuanKeuangan',
                    'realisasiAksesListrik', 'realisasiInternetDesa',
                ];
                for (const model of models) { await tx[model].deleteMany({ where: { dataRealisasiId: Number(id) } }); }
                await tx.dataRealisasi.update({ where: { id: Number(id) }, data: { statusVerifikasi: 'Ditolak', catatanRevisi: catatan, diVerifikasiOleh: req.user.id, tanggalVerifikasi: null } });
            });
            res.json({ status: "success", msg: "Laporan Berhasil Ditolak" });
        } catch (error) { res.status(500).json({ msg: "Gagal menolak laporan", error: error.message }); }
    },

    getDetailLaporan: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, programKerjaId } = req.user;
            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: { subProgram: { select: { namaSubProgram: true, slug: true, programKerjaId: true } }, inputer: { select: { username: true, kontak: true } }, verifikator: { select: { username: true } }, ...INCLUDE_ALL }
            });
            if (!headerData) return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            if (role === 'Kepala Dinas' && headerData.subProgram.programKerjaId !== programKerjaId) return res.status(403).json({ msg: "Akses Ditolak." });

            let detailItems = [], tipeLaporan = "";
            if (headerData.detailBosda?.length > 0) { detailItems = headerData.detailBosda.map(item => ({ ...item, nominal: parseNom(item.nominal) })); tipeLaporan = "BOSDA"; }
            else if (headerData.detailSpp?.length > 0) { detailItems = headerData.detailSpp.map(item => ({ ...item, nominal: parseNom(item.nominal), realisasiSma: parseNom(item.realisasiSma), realisasiSmk: parseNom(item.realisasiSmk), realisasiSlb: parseNom(item.realisasiSlb) })); tipeLaporan = "SPP"; }
            else if (headerData.detailBeasiswaCerdas?.length > 0) { detailItems = headerData.detailBeasiswaCerdas.map(item => ({ ...item, nominal: parseNom(item.realisasi) })); tipeLaporan = "Beasiswa Cerdas Istimewa"; }
            else if (headerData.detailBeasiswaMiskin?.length > 0) { detailItems = headerData.detailBeasiswaMiskin.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Beasiswa Miskin/Berprestasi"; }
            else if (headerData.detailPrakerin?.length > 0) { detailItems = headerData.detailPrakerin.map(item => ({ ...item, nominal: parseNom(item.realisasiNegeri) + parseNom(item.realisasiSwasta) })); tipeLaporan = "Prakerin"; }
            else if (headerData.detailBeasiswa?.length > 0) { detailItems = headerData.detailBeasiswa.map(item => ({ ...item, nominal: parseNom(item.nominal) })); tipeLaporan = "Beasiswa"; }
            else if (headerData.detailDigital?.length > 0) { detailItems = headerData.detailDigital.map(item => ({ ...item, nominal: parseNom(item.realisasi) })); tipeLaporan = "Digitalisasi"; }
            else if (headerData.detailVokasi?.length > 0) { detailItems = headerData.detailVokasi.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Vokasi"; }
            else if (headerData.detailCareer?.length > 0) { detailItems = headerData.detailCareer.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Career Center"; }
            else if (headerData.detailIplm?.length > 0) { detailItems = headerData.detailIplm.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "IPLM"; }
            else if (headerData.detailSeragam?.length > 0) { detailItems = headerData.detailSeragam.map(item => ({ ...item, nominal: parseNom(item.nominal) })); tipeLaporan = "Seragam"; }
            else if (headerData.detailPemeriksaanGratis?.length > 0) { detailItems = headerData.detailPemeriksaanGratis.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Pemeriksaan Kesehatan Gratis"; }
            else if (headerData.detailNasehaKami?.length > 0) { detailItems = headerData.detailNasehaKami.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Naseha Kami"; }
            else if (headerData.detailRsRujukan?.length > 0) { detailItems = headerData.detailRsRujukan.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "RS Rujukan Internasional"; }
            else if (headerData.detailStunting?.length > 0) { detailItems = headerData.detailStunting.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Pencegahan Stunting"; }
            else if (headerData.detailKualitasRs?.length > 0) { detailItems = headerData.detailKualitasRs.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Kualitas Layanan RS"; }
            else if (headerData.detailJaminanHarga?.length > 0) { detailItems = headerData.detailJaminanHarga.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Jaminan Harga Bahan Pokok"; }
            else if (headerData.detailPanada?.length > 0) { detailItems = headerData.detailPanada.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "PANADA"; }
            else if (headerData.detailUep?.length > 0) { detailItems = headerData.detailUep.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "UEP Graduasi"; }
            else if (headerData.detailRutilahu?.length > 0) { detailItems = headerData.detailRutilahu.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Revitalisasi Rutilahu"; }
            else if (headerData.detailUmkm?.length > 0) { detailItems = headerData.detailUmkm.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Pelatihan UMKM"; }
            else if (headerData.detailMbg?.length > 0) { detailItems = headerData.detailMbg.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Makan Bergizi Gratis"; }
            else if (headerData.detailGaspoll?.length > 0) { detailItems = headerData.detailGaspoll.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Tim Gaspoll / Command Center"; }
            else if (headerData.detailSpbe?.length > 0) { detailItems = headerData.detailSpbe.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Super Apps / SPBE"; }
            else if (headerData.detailBudayaKerja?.length > 0) { detailItems = headerData.detailBudayaKerja.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Budaya Kerja Birokrasi"; }
            else if (headerData.detailBantuanKeuangan?.length > 0) { detailItems = headerData.detailBantuanKeuangan.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Bantuan Keuangan Pemerintah Desa"; }
            else if (headerData.detailAksesListrik?.length > 0) { detailItems = headerData.detailAksesListrik.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Akses Listrik"; }
            else if (headerData.detailInternetDesa?.length > 0) { detailItems = headerData.detailInternetDesa.map(item => ({ ...item, nominal: parseNom(item.realisasiAnggaran) })); tipeLaporan = "Internet Desa"; }

            if (tipeLaporan === "") {
                const slug = headerData.subProgram.slug.toLowerCase();
                if (slug.includes('bosda')) tipeLaporan = "BOSDA";
                else if (slug.includes('spp')) tipeLaporan = "SPP";
                else if (slug.includes('cerdas') || slug.includes('smanor')) tipeLaporan = "Beasiswa Cerdas Istimewa";
                else if (slug.includes('penyelesaian') || slug.includes('aktif-miskin')) tipeLaporan = "Beasiswa Miskin/Berprestasi";
                else if (slug.includes('prakerin')) tipeLaporan = "Prakerin";
                else if (slug.includes('beasiswa')) tipeLaporan = "Beasiswa";
                else if (slug.includes('digital') || slug.includes('sarana')) tipeLaporan = "Digitalisasi";
                else if (slug.includes('vokasi')) tipeLaporan = "Vokasi";
                else if (slug.includes('career')) tipeLaporan = "Career Center";
                else if (slug.includes('iplm') || slug.includes('literasi')) tipeLaporan = "IPLM";
                else if (slug.includes('seragam')) tipeLaporan = "Seragam";
                else if (slug.includes('pemeriksaan') || slug.includes('gratis')) tipeLaporan = "Pemeriksaan Kesehatan Gratis";
                else if (slug.includes('naseha') || slug.includes('jaminan-layanan')) tipeLaporan = "Naseha Kami";
                else if (slug.includes('rujukan') || slug.includes('internasional')) tipeLaporan = "RS Rujukan Internasional";
                else if (slug.includes('stunting')) tipeLaporan = "Pencegahan Stunting";
                else if (slug.includes('kualitas') || slug.includes('undata') || slug.includes('madani')) tipeLaporan = "Kualitas Layanan RS";
                else if (slug.includes('jaminan') || slug.includes('bahan-pokok')) tipeLaporan = "Jaminan Harga Bahan Pokok";
                else if (slug.includes('panada') || slug.includes('pangan-daerah')) tipeLaporan = "PANADA";
                else if (slug.includes('uep') || slug.includes('graduasi')) tipeLaporan = "UEP Graduasi";
                else if (slug.includes('rutilahu')) tipeLaporan = "Revitalisasi Rutilahu";
                else if (slug.includes('umkm') || slug.includes('kewirausahaan')) tipeLaporan = "Pelatihan UMKM";
                else if (slug.includes('mbg') || slug.includes('makan-bergizi')) tipeLaporan = "Makan Bergizi Gratis";
                else if (slug.includes('gaspoll') || slug.includes('command-center') || slug.includes('call-center')) tipeLaporan = "Tim Gaspoll / Command Center";
                else if (slug.includes('spbe') || slug.includes('super-app') || slug.includes('layanan-publik')) tipeLaporan = "Super Apps / SPBE";
                else if (slug.includes('budaya-kerja') || slug.includes('birokrasi') || slug.includes('akuntabel')) tipeLaporan = "Budaya Kerja Birokrasi";
                else if (slug.includes('bantuan-keuangan') || slug.includes('pemerintah-desa')) tipeLaporan = "Bantuan Keuangan Pemerintah Desa";
                else if (slug.includes('listrik') || slug.includes('penerangan') || slug.includes('lampu')) tipeLaporan = "Akses Listrik";
                else if (slug.includes('internet') || slug.includes('blank') || slug.includes('jaringan')) tipeLaporan = "Internet Desa";
                else tipeLaporan = "Umum";
            }

            const result = {
                header: { id: headerData.id, namaLaporan: headerData.namaLaporan, tahun: headerData.tahun, program: headerData.subProgram.namaSubProgram, status: headerData.statusVerifikasi, tanggalInput: headerData.tanggalInput, tanggalVerifikasi: headerData.tanggalVerifikasi || '-', pengirim: headerData.inputer.username, kontakPengirim: headerData.inputer.kontak, verifikator: headerData.verifikator?.username || '-', catatanRevisi: headerData.catatanRevisi || '-', buktiDukung: headerData.buktiDukung, tipe: tipeLaporan },
                items: detailItems
            };
            res.json({ status: "success", data: result });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    },

    getDataBySubProgram: async (req, res) => {
        try {
            const { slug } = req.params;
            const userProgramId = req.user.programKerjaId;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();
            const subProgram = await prisma.subProgramKerja.findUnique({ where: { slug }, include: { programKerja: true, targetTahunan: { where: { tahun } } } });
            if (!subProgram) return res.status(404).json({ msg: "Sub Program tidak ditemukan." });
            if (subProgram.programKerjaId !== userProgramId) return res.status(403).json({ msg: "Akses Ditolak." });
            const targetData = subProgram.targetTahunan[0];
            const allReports = await prisma.dataRealisasi.findMany({ where: { subProgramId: subProgram.id, statusVerifikasi: 'Disetujui', tahun }, orderBy: { tanggalVerifikasi: 'desc' }, include: INCLUDE_ALL });

            let itemsList = [], totalFisik = 0;
            allReports.forEach(header => {
                if (header.detailBosda?.length) { header.detailBosda.forEach(item => { totalFisik += (Number(item.smaNegeri) || 0) + (Number(item.smaSwasta) || 0) + (Number(item.smk) || 0) + (Number(item.slbNegeri) || 0) + (Number(item.slbSwasta) || 0); itemsList.push({ ...item, nominal: parseNom(item.nominal) }); }); }
                else if (header.detailSpp?.length) { header.detailSpp.forEach(item => { totalFisik += (Number(item.siswaSma) || 0) + (Number(item.siswaSmk) || 0) + (Number(item.siswaSlb) || 0); itemsList.push({ ...item, nominal: parseNom(item.nominal), realisasiSma: parseNom(item.realisasiSma), realisasiSmk: parseNom(item.realisasiSmk), realisasiSlb: parseNom(item.realisasiSlb) }); }); }
                else if (header.detailBeasiswaCerdas?.length) { header.detailBeasiswaCerdas.forEach(item => { totalFisik += Number(item.jumlahSiswa) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasi) }); }); }
                else if (header.detailBeasiswaMiskin?.length) { header.detailBeasiswaMiskin.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailPrakerin?.length) { header.detailPrakerin.forEach(item => { totalFisik += (Number(item.smkNegeri) || 0) + (Number(item.smkSwasta) || 0); itemsList.push({ ...item, nominal: parseNom(item.realisasiNegeri) + parseNom(item.realisasiSwasta) }); }); }
                else if (header.detailDigital?.length) { header.detailDigital.forEach(item => { totalFisik += Number(item.jumlahSekolah) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasi) }); }); }
                else if (header.detailVokasi?.length) { header.detailVokasi.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailCareer?.length) { header.detailCareer.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailIplm?.length) { header.detailIplm.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailSeragam?.length) { totalFisik += header.detailSeragam.length; header.detailSeragam.forEach(item => itemsList.push({ ...item, nominal: parseNom(item.nominal) })); }
                else if (header.detailBeasiswa?.length) { totalFisik += header.detailBeasiswa.length; header.detailBeasiswa.forEach(item => itemsList.push({ ...item, nominal: parseNom(item.nominal) })); }
                else if (header.detailPemeriksaanGratis?.length) { header.detailPemeriksaanGratis.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailNasehaKami?.length) { header.detailNasehaKami.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailRsRujukan?.length) { header.detailRsRujukan.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailStunting?.length) { header.detailStunting.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailKualitasRs?.length) { header.detailKualitasRs.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailJaminanHarga?.length) { header.detailJaminanHarga.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailPanada?.length) { header.detailPanada.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailUep?.length) { header.detailUep.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailRutilahu?.length) { header.detailRutilahu.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailUmkm?.length) { header.detailUmkm.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailMbg?.length) { header.detailMbg.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailGaspoll?.length) { header.detailGaspoll.forEach(item => { totalFisik += 1; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailSpbe?.length) { header.detailSpbe.forEach(item => { totalFisik += 1; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailBudayaKerja?.length) { header.detailBudayaKerja.forEach(item => { totalFisik += 1; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailBantuanKeuangan?.length) { header.detailBantuanKeuangan.forEach(item => { totalFisik += 1; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailAksesListrik?.length) { header.detailAksesListrik.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
                else if (header.detailInternetDesa?.length) { header.detailInternetDesa.forEach(item => { totalFisik += Number(item.realisasiKinerja) || 0; itemsList.push({ ...item, nominal: parseNom(item.realisasiAnggaran) }); }); }
            });

            res.json({ status: "success", program: subProgram.programKerja.namaProgram, subProgram: subProgram.namaSubProgram, tahun, target: targetData?.target ?? 0, anggaran: targetData?.anggaran?.toString() ?? '0', totalRealisasi: totalFisik, data: itemsList });
        } catch (error) { res.status(500).json({ msg: error.message }); }
    }
};

export default kadisController;