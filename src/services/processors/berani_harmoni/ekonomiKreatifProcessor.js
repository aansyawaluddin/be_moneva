import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (rawData.length === 0) throw new Error("Excel Berani Ekonomi Kreatif kosong");

    const dataExcel = rawData.map(row => {
        const normalized = {};
        for (const key of Object.keys(row)) { normalized[key.trim()] = row[key]; }
        return normalized;
    });

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        perangkatDaerah: String(row['Perangkat Daerah'] || '-').trim(),
        satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
        targetKinerja: isNaN(Number(row['Target Kinerja'])) ? null : Number(row['Target Kinerja']),
        targetAnggaran: isNaN(Number(row['Target Anggaran'])) ? 0 : Number(row['Target Anggaran']),
        realisasiKinerja: isNaN(Number(row['Realisasi Kinerja'])) ? null : Number(row['Realisasi Kinerja']),
        realisasiAnggaran: isNaN(cleanCurrency(row['Realisasi Anggaran'])) ? null : cleanCurrency(row['Realisasi Anggaran']),
        capaianKinerja: row['Capaian (%) Kinerja'] != null ? String(row['Capaian (%) Kinerja']).trim() : null,
        capaianAnggaran: row['Capaian (%) Anggaran'] != null ? String(row['Capaian (%) Anggaran']).trim() : null,
    }));

    await tx.realisasiEkonomiKreatif.createMany({ data: detailData });
    return detailData.length;
};

export default process;