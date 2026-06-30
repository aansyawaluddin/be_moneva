import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (rawData.length === 0) throw new Error("Excel Jaminan Ketersediaan Drainase kosong");

    const dataExcel = rawData.map(row => {
        const normalized = {};
        for (const key of Object.keys(row)) { normalized[key.trim()] = row[key]; }
        return normalized;
    });

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        uraian: String(row['Uraian'] || '-').trim(),
        kabupatenKota: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : null,
        satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
        targetKinerja: isNaN(Number(row['Target Kinerja'])) ? null : Number(row['Target Kinerja']),
        targetAnggaran: isNaN(Number(row['Target Anggaran'])) ? 0 : Number(row['Target Anggaran']),
        realisasiKinerja: isNaN(Number(row['Realisasi Kinerja'])) ? null : Number(row['Realisasi Kinerja']),
        realisasiPersenKinerja: row['Realisasi (%) Kinerja'] != null ? String(row['Realisasi (%) Kinerja']).trim() : null,
        realisasiAnggaran: isNaN(cleanCurrency(row['Realisasi Anggaran'])) ? null : cleanCurrency(row['Realisasi Anggaran']),
    }));

    await tx.realisasiDrainase.createMany({ data: detailData });
    return detailData.length;
};

export default process;