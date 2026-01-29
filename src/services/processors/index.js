import beasiswaProcessor from './beasiswaProcessor.js';
import bosdaProcessor from './bosdaProcessor.js';

const processorRegistry = {
    'beasiswa': beasiswaProcessor,
    'bosda' : bosdaProcessor
};

export const getProcessor = (subProgramName) => {
    const nameLower = subProgramName.toLowerCase();

    const key = Object.keys(processorRegistry).find(k => nameLower.includes(k));

    if (!key) {
        throw new Error(`Processor untuk program "${subProgramName}" belum dibuat.`);
    }

    return processorRegistry[key];
};