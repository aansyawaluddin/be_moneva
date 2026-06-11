import beasiswaProcessor from './berani_cerdas/beasiswaProcessor.js';
import bosdaProcessor from './berani_cerdas/bosdaProcessor.js';
import sppProcessor from './berani_cerdas/sppProcessor.js';
import beasiswaCerdasProcessor from './berani_cerdas/beasiswaCerdasProcessor.js';
import prakerinProcessor from './berani_cerdas/prakerinProcessor.js';
import beasiswaMiskinProcessor from './berani_cerdas/beasiswaMiskinProcessor.js';
import digitalProcessor from './berani_cerdas/digitalProcessor.js';
import vokasionalProcessor from './berani_cerdas/vokasionalProcessor.js';
import carierCenterProcessor from './berani_cerdas/careerCenterProcessor.js';
import iplmProcessor from './berani_cerdas/iplmProcessor.js';
import seragamProcessor from './berani_cerdas/seragamProcessor.js';

// Berani Sehat
import pemeriksaanGratisProcessor from './berani_sehat/pemeriksaanGratisProcessor.js';
import nasehaKamiProcessor from './berani_sehat/nasehaKamiProcessor.js';
import rsRujukanProcessor from './berani_sehat/rsRujukanProcessor.js';
import stuntingProcessor from './berani_sehat/stuntingProcessor.js';
import kualitasRsProcessor from './berani_sehat/kualitasRsProcessor.js';


const processorRegistry = {
    // Berani Cerdas
    'bosda': bosdaProcessor,
    'spp': sppProcessor,
    'beasiswa-cerdas': beasiswaCerdasProcessor,
    'prakerin': prakerinProcessor,
    'beasiswa-miskin': beasiswaMiskinProcessor,
    'digital': digitalProcessor,
    'vokasional': vokasionalProcessor,
    'career': carierCenterProcessor,
    'iplm': iplmProcessor,
    'seragam': seragamProcessor,
    'beasiswa': beasiswaProcessor,
    // Berani Sehat
    'pemeriksaan-gratis': pemeriksaanGratisProcessor,
    'naseha-kami': nasehaKamiProcessor,
    'rs-rujukan': rsRujukanProcessor,
    'stunting': stuntingProcessor,
    'kualitas-rs': kualitasRsProcessor,
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
    } else if (nameLower.includes('rujukan') || nameLower.includes('internasional') || nameLower.includes('undata') && nameLower.includes('madani') && nameLower.includes('rujukan')) {
        foundKey = 'rs-rujukan';
    } else if (nameLower.includes('stunting')) {
        foundKey = 'stunting';
    } else if (nameLower.includes('kualitas layanan') || (nameLower.includes('undata') && nameLower.includes('madani') && !nameLower.includes('rujukan'))) {
        foundKey = 'kualitas-rs';
    }

    if (foundKey) {
        console.log(`LOG: Processor ditemukan: ${foundKey}`);
        return processorRegistry[foundKey];
    }

    throw new Error(`Processor untuk program "${subProgramName}" belum tersedia.`);
};