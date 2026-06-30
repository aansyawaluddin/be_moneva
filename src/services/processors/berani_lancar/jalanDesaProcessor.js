import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (rawData.length === 0) throw new Error("Excel Pembangunan 1000 KM Jalan Desa kosong");

    const dataExcel = rawData.map(row => {
        const normalized = {};
        for (const key of Object.keys(row)) { normalized[key.trim()] = row[key]; }
        return normalized;
    });

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        perangkatDaerah: String(row['Perangkat Daerah'] || '-').trim(),
        sasaranProgram: row['Sasaran/Program'] ? String(row['Sasaran/Program']).trim() : null,
        kabupatenKota: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : null,
        satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
        targetKinerja: isNaN(Number(row['Target Kinerja'])) ? null : Number(row['Target Kinerja']),
        targetAnggaran: isNaN(Number(row['Target Anggaran'])) ? 0 : Number(row['Target Anggaran']),
        realisasiKinerja: isNaN(Number(row['Realisasi Kinerja'])) ? null : Number(row['Realisasi Kinerja']),
        realisasiAnggaran: isNaN(cleanCurrency(row['Realisasi Anggaran'])) ? null : cleanCurrency(row['Realisasi Anggaran']),
    }));

    await tx.realisasiJalanDesa.createMany({ data: detailData });
    return detailData.length;
};

export default process;