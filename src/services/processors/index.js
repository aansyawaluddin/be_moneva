import beasiswaProcessor from './berani_cerdas/beasiswaProcessor.js';
import bosdaProcessor from './berani_cerdas/bosdaProcessor.js';
import sppProcessor from './berani_cerdas/sppProcessor.js';
import beasiswaCerdasProcessor from './berani_cerdas/beasiswaCerdasProcessor.js';
import prakerinProcessor from './berani_cerdas/prakerinProcessor.js';
import beasiswaMiskinProcessor from './berani_cerdas/beasiswaMiskinProcessor.js';
import digitalProcessor from './berani_cerdas/digitalProcessor.js';
import vokasionalProcessor from './berani_cerdas/vokasionalProcessor.js';
import careerCenterProcessor from './berani_cerdas/careerCenterProcessor.js';
import iplmProcessor from './berani_cerdas/iplmProcessor.js';
import seragamProcessor from './berani_cerdas/seragamProcessor.js';

// Berani Sehat
import pemeriksaanGratisProcessor from './berani_sehat/pemeriksaanGratisProcessor.js';
import nasehaKamiProcessor from './berani_sehat/nasehaKamiProcessor.js';
import rsRujukanProcessor from './berani_sehat/rsRujukanProcessor.js';
import stuntingProcessor from './berani_sehat/stuntingProcessor.js';
import kualitasRsProcessor from './berani_sehat/kualitasRsProcessor.js';

// Berani Sejahtera
import jaminanHargaProcessor from './berani_sejahtera/jaminanHargaProcessor.js';
import panadaProcessor from './berani_sejahtera/panadaProcessor.js';
import uepProcessor from './berani_sejahtera/uepProcessor.js';
import rutilahuProcessor from './berani_sejahtera/rutilahuProcessor.js';
import umkmProcessor from './berani_sejahtera/umkmProcessor.js';
import mbgProcessor from './berani_sejahtera/mbgProcessor.js';

// Berani Menyala
import aksesListrikProcessor from './berani_menyala/aksesListrikProcessor.js';
import internetDesaProcessor from './berani_menyala/internetDesaProcessor.js';

// Berani Integritas
import gaspollProcessor from './berani_integritas/gaspollProcessor.js';
import spbeProcessor from './berani_integritas/spbeProcessor.js';
import budayaKerjaProcessor from './berani_integritas/budayaKerjaProcessor.js';
import bantuanKeuanganProcessor from './berani_integritas/bantuanKeuanganProcessor.js';

const processorRegistry = {
    // Berani Cerdas
    'bosda': bosdaProcessor,
    'spp': sppProcessor,
    'beasiswa-cerdas': beasiswaCerdasProcessor,
    'prakerin': prakerinProcessor,
    'beasiswa-miskin': beasiswaMiskinProcessor,
    'digital': digitalProcessor,
    'vokasional': vokasionalProcessor,
    'career': careerCenterProcessor,
    'iplm': iplmProcessor,
    'seragam': seragamProcessor,
    'beasiswa': beasiswaProcessor,
    // Berani Sehat
    'pemeriksaan-gratis': pemeriksaanGratisProcessor,
    'naseha-kami': nasehaKamiProcessor,
    'rs-rujukan': rsRujukanProcessor,
    'stunting': stuntingProcessor,
    'kualitas-rs': kualitasRsProcessor,
    // Berani Sejahtera
    'jaminan-harga': jaminanHargaProcessor,
    'panada': panadaProcessor,
    'uep': uepProcessor,
    'rutilahu': rutilahuProcessor,
    'umkm': umkmProcessor,
    'mbg': mbgProcessor,
    // Berani Menyala
    'akses-listrik': aksesListrikProcessor,
    'internet-desa': internetDesaProcessor,
    // Berani Integritas
    'gaspoll': gaspollProcessor,
    'spbe': spbeProcessor,
    'budaya-kerja': budayaKerjaProcessor,
    'bantuan-keuangan': bantuanKeuanganProcessor,
};

export const getProcessor = (subProgramName) => {
    if (!subProgramName) throw new Error("Nama Sub Program tidak valid (kosong).");

    const nameLower = subProgramName.toLowerCase();
    console.log(`LOG: Mencari processor untuk program: "${subProgramName}"`);

    let foundKey = null;

    // ===== BERANI CERDAS =====
    if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
        foundKey = 'bosda';
    } else if (nameLower.includes('spp') || nameLower.includes('biaya spp')) {
        foundKey = 'spp';
    } else if (nameLower.includes('cerdas') || nameLower.includes('bakat istimewa') || nameLower.includes('smanor')) {
        foundKey = 'beasiswa-cerdas';
    } else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
        foundKey = 'prakerin';
    } else if (nameLower.includes('penyelesaian studi') || (nameLower.includes('miskin') && nameLower.includes('aktif'))) {
        foundKey = 'beasiswa-miskin';
    } else if (nameLower.includes('digital') || nameLower.includes('sarana prasarana')) {
        foundKey = 'digital';
    } else if (nameLower.includes('vokasional') || nameLower.includes('siap kerja')) {
        foundKey = 'vokasional';
    } else if (nameLower.includes('career') || nameLower.includes('karir')) {
        foundKey = 'career';
    } else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
        foundKey = 'iplm';
    } else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
        foundKey = 'seragam';
    } else if (nameLower.includes('beasiswa')) {
        foundKey = 'beasiswa';

        // ===== BERANI SEHAT =====
    } else if (nameLower.includes('pemeriksaan kesehatan gratis') || nameLower.includes('dukungan terhadap pelaksanaan')) {
        foundKey = 'pemeriksaan-gratis';
    } else if (nameLower.includes('naseha') || nameLower.includes('jaminan layanan kesehatan')) {
        foundKey = 'naseha-kami';
    } else if (nameLower.includes('rujukan') || nameLower.includes('internasional')) {
        foundKey = 'rs-rujukan';
    } else if (nameLower.includes('stunting')) {
        foundKey = 'stunting';
    } else if (nameLower.includes('kualitas layanan') || (nameLower.includes('undata') && nameLower.includes('madani') && !nameLower.includes('rujukan'))) {
        foundKey = 'kualitas-rs';

        // ===== BERANI SEJAHTERA =====
    } else if (nameLower.includes('jaminan') || nameLower.includes('bahan pokok')) {
        foundKey = 'jaminan-harga';
    } else if (nameLower.includes('panada') || nameLower.includes('pangan daerah')) {
        foundKey = 'panada';
    } else if (nameLower.includes('uep') || nameLower.includes('usaha ekonomi produktif') || nameLower.includes('graduasi')) {
        foundKey = 'uep';
    } else if (nameLower.includes('rutilahu')) {
        foundKey = 'rutilahu';
    } else if (nameLower.includes('umkm') || nameLower.includes('kewirausahaan')) {
        foundKey = 'umkm';
    } else if (nameLower.includes('mbg') || nameLower.includes('makan bergizi')) {
        foundKey = 'mbg';

        // ===== BERANI INTEGRITAS =====
    } else if (nameLower.includes('gaspoll') || nameLower.includes('command center') || nameLower.includes('call center') || nameLower.includes('siaga laporan')) {
        foundKey = 'gaspoll';
    } else if (nameLower.includes('spbe') || nameLower.includes('super app') || nameLower.includes('super aps') || nameLower.includes('layanan publik terintegrasi')) {
        foundKey = 'spbe';
    } else if (nameLower.includes('budaya kerja') || nameLower.includes('birokrasi') || nameLower.includes('akuntabel') || nameLower.includes('reformasi birokrasi')) {
        foundKey = 'budaya-kerja';
    } else if (nameLower.includes('bantuan keuangan') || nameLower.includes('pemerintah desa') || nameLower.includes('pemerintah des')) {
        foundKey = 'bantuan-keuangan';

        // ===== BERANI MENYALA =====
    } else if (nameLower.includes('listrik') || nameLower.includes('penerangan') || nameLower.includes('lampu jalan')) {
        foundKey = 'akses-listrik';
    } else if (nameLower.includes('internet') || nameLower.includes('blank spot') || nameLower.includes('jaringan')) {
        foundKey = 'internet-desa';
    }

    if (foundKey) {
        console.log(`LOG: Processor ditemukan: ${foundKey}`);
        return processorRegistry[foundKey];
    }

    throw new Error(`Processor untuk program "${subProgramName}" belum tersedia.`);
};