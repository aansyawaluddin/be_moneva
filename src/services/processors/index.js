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


const processorRegistry = {
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
};

export const getProcessor = (subProgramName) => {
    if (!subProgramName) throw new Error("Nama Sub Program tidak valid (kosong).");

    const nameLower = subProgramName.toLowerCase();

    console.log(`LOG: Mencari processor untuk program: "${subProgramName}"`);

    let foundKey = null;

    // 1. Cek BOSDA
    if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
        foundKey = 'bosda';
    }
    // 2. Cek SPP
    else if (nameLower.includes('spp') || nameLower.includes('biaya spp')) {
        foundKey = 'spp';
    }
    // 3. Cek Beasiswa Cerdas / SMANOR (sebelum beasiswa umum karena lebih spesifik)
    else if (nameLower.includes('cerdas') || nameLower.includes('bakat istimewa') || nameLower.includes('smanor')) {
        foundKey = 'beasiswa-cerdas';
    }
    // 4. Cek Prakerin
    else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
        foundKey = 'prakerin';
    }
    // 5. Cek Beasiswa Miskin / Berprestasi / Penyelesaian Studi
    else if (nameLower.includes('penyelesaian studi') || (nameLower.includes('miskin') && nameLower.includes('aktif'))) {
        foundKey = 'beasiswa-miskin';
    }
    // 5. Cek Digitalisasi
    else if (nameLower.includes('digital') || nameLower.includes('sarana prasarana')) {
        foundKey = 'digital';
    }
    // 6. Cek Vokasi
    else if (nameLower.includes('vokasional') || nameLower.includes('siap kerja')) {
        foundKey = 'vokasional';
    }
    // 7. Cek Career Center
    else if (nameLower.includes('career') || nameLower.includes('karir')) {
        foundKey = 'career';
    }
    // 8. Cek IPLM / Literasi / Minat Baca
    else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
        foundKey = 'iplm';
    }
    // 9. Cek Seragam
    else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
        foundKey = 'seragam';
    }
    // 10. Cek Beasiswa (Terakhir karena paling umum)
    else if (nameLower.includes('beasiswa')) {
        foundKey = 'beasiswa';
    }

    if (foundKey) {
        console.log(`LOG: Processor ditemukan: ${foundKey}`);
        return processorRegistry[foundKey];
    }

    throw new Error(`Processor untuk program "${subProgramName}" belum tersedia.`);
};