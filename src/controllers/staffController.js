import prisma from '../utils/prisma.js';
import fs from 'fs';
import { getProcessor } from '../services/processors/index.js';

const parseNom = (val) => val ? Number(val.toString()) : 0;

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
    detailAksesListrik: true, detailInternetDesa: true,
};

const staffController = {

    getJobdesk: async (req, res) => {
        try {
            const userProgramId = req.user.programKerjaId;
            const tahun = Number(req.query.tahun) || new Date().getFullYear();
            if (!userProgramId) return res.status(400).json({ msg: "Anda belum ditugaskan ke Program Kerja manapun." });
            const programData = await prisma.programKerja.findUnique({ where: { id: Number(userProgramId) }, include: { subProgram: { orderBy: { id: 'asc' }, include: { targetTahunan: { where: { tahun } } } } } });
            if (!programData) return res.status(404).json({ msg: "Data Program Kerja tidak ditemukan." });
            const result = {
                programKerja: { id: programData.id, namaProgram: programData.namaProgram, slug: programData.slug, deskripsiProgram: programData.deskripsi },
                tahun,
                daftarSubProgram: programData.subProgram.map(sub => { const t = sub.targetTahunan[0]; return { id: sub.id, namaSubProgram: sub.namaSubProgram, slug: sub.slug, target: t?.target ?? 0, anggaran: t?.anggaran?.toString() ?? '0' }; })
            };
            res.json({ status: "success", data: result });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    },

    uploadLaporan: async (req, res) => {
        try {
            const file = req.file;
            const { subProgramId, namaLaporan } = req.body;
            const userProgramId = req.user.programKerjaId;
            const tahun = req.body.tahun ? Number(req.body.tahun) : new Date().getFullYear();
            const tahunSekarang = new Date().getFullYear();
            if (isNaN(tahun) || tahun < 2020 || tahun > tahunSekarang) { if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path); return res.status(400).json({ msg: `Tahun tidak valid. Masukkan tahun antara 2020 s/d ${tahunSekarang}.` }); }
            if (!file) return res.status(400).json({ msg: "File Excel wajib diupload" });
            if (!subProgramId || isNaN(Number(subProgramId))) { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); return res.status(400).json({ msg: "Sub Program ID kosong atau tidak valid." }); }
            const subProgramCheck = await prisma.subProgramKerja.findFirst({ where: { id: Number(subProgramId), programKerjaId: Number(userProgramId) }, include: { targetTahunan: { where: { tahun } } } });
            if (!subProgramCheck) { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); return res.status(403).json({ msg: "Anda tidak berhak mengupload laporan untuk Sub Program ini." }); }
            if (subProgramCheck.targetTahunan.length === 0) console.warn(`⚠️  Upload untuk tahun ${tahun} tapi SubProgramTarget belum ada (subProgramId: ${subProgramId})`);
            let headerId;
            await prisma.$transaction(async (tx) => {
                const header = await tx.dataRealisasi.create({ data: { subProgramId: Number(subProgramId), tahun, namaLaporan, diInputOleh: req.user.id, statusVerifikasi: 'Menunggu', tanggalInput: new Date(), buktiDukung: file.filename } });
                headerId = header.id;
                const processor = getProcessor(subProgramCheck.namaSubProgram);
                if (processor) { await processor(tx, header.id, file.path); } else { throw new Error(`Prosesor Excel tidak ditemukan untuk: ${subProgramCheck.namaSubProgram}`); }
            });
            const savedData = await prisma.dataRealisasi.findUnique({ where: { id: headerId } });
            res.status(201).json({ status: "success", msg: `Laporan tahun ${tahun} berhasil diupload dan diekstrak. Menunggu verifikasi atasan.`, data: savedData });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            console.error(error); res.status(500).json({ msg: "Gagal upload atau format Excel salah", error: error.message });
        }
    },

    getMyUploads: async (req, res) => {
        try {
            const { slug } = req.params;
            const userId = req.user.id;
            const userProgramId = req.user.programKerjaId;
            const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;
            const subProgram = await prisma.subProgramKerja.findUnique({ where: { slug } });
            if (!subProgram) return res.status(404).json({ msg: "Sub Program tidak ditemukan." });
            if (subProgram.programKerjaId !== userProgramId) return res.status(403).json({ msg: "Akses Ditolak: Anda tidak ditugaskan di Sub Program ini." });
            const data = await prisma.dataRealisasi.findMany({ where: { diInputOleh: userId, subProgramId: subProgram.id, ...(tahun && { tahun }) }, orderBy: { tanggalInput: 'desc' }, include: { subProgram: { select: { namaSubProgram: true, slug: true } }, verifikator: { select: { username: true } } } });
            res.json({ status: "success", subProgram: subProgram.namaSubProgram, tahun: tahun ?? 'semua', data });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    },

    getDetailLaporan: async (req, res) => {
        try {
            const { slug, id } = req.params;
            const userProgramId = req.user.programKerjaId;
            const headerData = await prisma.dataRealisasi.findUnique({
                where: { id: Number(id) },
                include: { subProgram: { select: { namaSubProgram: true, programKerjaId: true, slug: true } }, verifikator: { select: { username: true } }, ...INCLUDE_ALL }
            });
            if (!headerData) return res.status(404).json({ msg: "Laporan tidak ditemukan." });
            if (headerData.subProgram.slug !== slug) return res.status(404).json({ msg: "Laporan ini tidak termasuk dalam sub program tersebut." });
            if (headerData.subProgram.programKerjaId !== userProgramId) return res.status(403).json({ msg: "Akses Ditolak: Laporan ini bukan wilayah kerja Anda." });

            let detailItems = [], tipeLaporan = "";
            if (headerData.detailBosda?.length > 0) { detailItems = headerData.detailBosda; tipeLaporan = "BOSDA"; }
            else if (headerData.detailSpp?.length > 0) { detailItems = headerData.detailSpp; tipeLaporan = "SPP"; }
            else if (headerData.detailBeasiswaCerdas?.length > 0) { detailItems = headerData.detailBeasiswaCerdas; tipeLaporan = "Beasiswa Cerdas Istimewa"; }
            else if (headerData.detailBeasiswaMiskin?.length > 0) { detailItems = headerData.detailBeasiswaMiskin; tipeLaporan = "Beasiswa Miskin/Berprestasi"; }
            else if (headerData.detailPrakerin?.length > 0) { detailItems = headerData.detailPrakerin; tipeLaporan = "Prakerin"; }
            else if (headerData.detailBeasiswa?.length > 0) { detailItems = headerData.detailBeasiswa; tipeLaporan = "Beasiswa"; }
            else if (headerData.detailDigital?.length > 0) { detailItems = headerData.detailDigital; tipeLaporan = "Digitalisasi"; }
            else if (headerData.detailVokasi?.length > 0) { detailItems = headerData.detailVokasi; tipeLaporan = "Vokasi"; }
            else if (headerData.detailCareer?.length > 0) { detailItems = headerData.detailCareer; tipeLaporan = "Career Center"; }
            else if (headerData.detailIplm?.length > 0) { detailItems = headerData.detailIplm; tipeLaporan = "IPLM"; }
            else if (headerData.detailSeragam?.length > 0) { detailItems = headerData.detailSeragam; tipeLaporan = "Seragam"; }
            else if (headerData.detailPemeriksaanGratis?.length > 0) { detailItems = headerData.detailPemeriksaanGratis; tipeLaporan = "Pemeriksaan Kesehatan Gratis"; }
            else if (headerData.detailNasehaKami?.length > 0) { detailItems = headerData.detailNasehaKami; tipeLaporan = "Naseha Kami"; }
            else if (headerData.detailRsRujukan?.length > 0) { detailItems = headerData.detailRsRujukan; tipeLaporan = "RS Rujukan Internasional"; }
            else if (headerData.detailStunting?.length > 0) { detailItems = headerData.detailStunting; tipeLaporan = "Pencegahan Stunting"; }
            else if (headerData.detailKualitasRs?.length > 0) { detailItems = headerData.detailKualitasRs; tipeLaporan = "Kualitas Layanan RS"; }
            else if (headerData.detailJaminanHarga?.length > 0) { detailItems = headerData.detailJaminanHarga; tipeLaporan = "Jaminan Harga Bahan Pokok"; }
            else if (headerData.detailPanada?.length > 0) { detailItems = headerData.detailPanada; tipeLaporan = "PANADA"; }
            else if (headerData.detailUep?.length > 0) { detailItems = headerData.detailUep; tipeLaporan = "UEP Graduasi"; }
            else if (headerData.detailRutilahu?.length > 0) { detailItems = headerData.detailRutilahu; tipeLaporan = "Revitalisasi Rutilahu"; }
            else if (headerData.detailUmkm?.length > 0) { detailItems = headerData.detailUmkm; tipeLaporan = "Pelatihan UMKM"; }
            else if (headerData.detailMbg?.length > 0) { detailItems = headerData.detailMbg; tipeLaporan = "Makan Bergizi Gratis"; }
            else if (headerData.detailAksesListrik?.length > 0) { detailItems = headerData.detailAksesListrik; tipeLaporan = "Akses Listrik"; }
            else if (headerData.detailInternetDesa?.length > 0) { detailItems = headerData.detailInternetDesa; tipeLaporan = "Internet Desa"; }

            const ANGGARAN_TYPES = [
                "Beasiswa Miskin/Berprestasi", "Vokasi", "Career Center", "IPLM",
                "Pemeriksaan Kesehatan Gratis", "Naseha Kami", "RS Rujukan Internasional",
                "Pencegahan Stunting", "Kualitas Layanan RS",
                "Jaminan Harga Bahan Pokok", "PANADA", "UEP Graduasi",
                "Revitalisasi Rutilahu", "Pelatihan UMKM", "Makan Bergizi Gratis",
                "Akses Listrik", "Internet Desa",
            ];

            detailItems = detailItems.map(item => {
                let f = { ...item };
                if (tipeLaporan === "Beasiswa Cerdas Istimewa") f.nominal = parseNom(item.realisasi);
                else if (ANGGARAN_TYPES.includes(tipeLaporan)) f.nominal = parseNom(item.realisasiAnggaran);
                else if (tipeLaporan === "Digitalisasi") f.nominal = parseNom(item.realisasi);
                else if (tipeLaporan === "Prakerin") f.nominal = parseNom(item.realisasiNegeri) + parseNom(item.realisasiSwasta);
                else f.nominal = parseNom(item.nominal);
                return f;
            });

            const result = {
                header: { id: headerData.id, namaLaporan: headerData.namaLaporan, tahun: headerData.tahun, subProgram: headerData.subProgram.namaSubProgram, jalur: headerData.jalur || '-', status: headerData.statusVerifikasi, catatanRevisi: headerData.catatanRevisi || '-', verifikator: headerData.verifikator?.username || '-', tanggalInput: headerData.tanggalInput, tanggalVerifikasi: headerData.tanggalVerifikasi || '-', buktiDukung: headerData.buktiDukung, tipe: tipeLaporan },
                items: detailItems
            };
            res.json({ status: "success", data: result });
        } catch (error) { console.error(error); res.status(500).json({ msg: error.message }); }
    }
};

export default staffController;