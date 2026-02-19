import beasiswaProcessor from './beasiswaProcessor.js';
import bosdaProcessor from './bosdaProcessor.js';
import sppProcessor from './sppProcessor.js';
import prakerinProcessor from './prakerinProcessor.js';
import digitalProcessor from './digitalProcessor.js';
import vokasionalProcessor from './vokasionalProcessor.js';
import carierCenterProcessor from './careerCenterProcessor.js';
import iplmProcessor from './iplmProcessor.js'
import seragamProcessor from './seragamProcessor.js';


const processorRegistry = {
    'beasiswa': beasiswaProcessor,
    'bosda': bosdaProcessor,
    'spp': sppProcessor,
    'prakerin': prakerinProcessor,
    'digital': digitalProcessor,
    'vokasional': vokasionalProcessor,
    'career': carierCenterProcessor,
    'iplm': iplmProcessor,
    'seragam': seragamProcessor
};

export const getProcessor = (subProgramName) => {
    if (!subProgramName) throw new Error("Nama Sub Program tidak valid (kosong).");

    const nameLower = subProgramName.toLowerCase();

    console.log(`LOG: Mencari processor untuk program: "${subProgramName}"`);

    let foundKey = null;

    // 1. Cek SPP (Prioritas karena namanya sering tertukar)
    if (nameLower.includes('spp') || nameLower.includes('biaya spp')) {
        foundKey = 'spp';
    }
    // 2. Cek Prakerin
    else if (nameLower.includes('prakerin') || nameLower.includes('uji kompetensi')) {
        foundKey = 'prakerin';
    }
    // 3. Cek Digitalisasi
    else if (nameLower.includes('digital') || nameLower.includes('sarana prasarana')) {
        foundKey = 'digital';
    }
    // 4. Cek Vokasi
    else if (nameLower.includes('vokasional') || nameLower.includes('siap kerja')) {
        foundKey = 'vokasional';
    }
    // 5. Cek Career Center
    else if (nameLower.includes('career') || nameLower.includes('karir')) {
        foundKey = 'career';
    }
    // 6. Cek Seragam
    else if (nameLower.includes('seragam') || nameLower.includes('sepatu')) {
        foundKey = 'seragam';
    }
    // 7. Cek IPLM / Literasi / Minat Baca (BARU)
    else if (nameLower.includes('iplm') || nameLower.includes('literasi') || nameLower.includes('minat baca')) {
        foundKey = 'iplm';
    }
    // 8. Cek BOSDA
    else if (nameLower.includes('bosda') || nameLower.includes('operasional')) {
        foundKey = 'bosda';
    }
    // 9. Cek Beasiswa (Terakhir karena paling umum)
    else if (nameLower.includes('beasiswa')) {
        foundKey = 'beasiswa';
    }

    // Jika ketemu, return fungsinya
    if (foundKey) {
        console.log(`LOG: Processor ditemukan: ${foundKey}`);
        return processorRegistry[foundKey];
    }

    // Jika tidak ketemu
    throw new Error(`Processor untuk program "${subProgramName}" belum tersedia.`);
};