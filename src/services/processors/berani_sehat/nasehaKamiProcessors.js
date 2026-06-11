import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);
    if (dataExcel.length === 0) throw new Error("Excel Naseha Kami kosong");

    const detailData = dataExcel
        .filter(row => row['Rincian Kegiatan'] && String(row['Rincian Kegiatan']).trim() !== '')
        .map(row => ({
            dataRealisasiId: headerId,
            rincianKegiatan: String(row['Rincian Kegiatan']).trim(),
            satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
            targetKinerja: row['Target Kinerja'] !== undefined ? Number(row['Target Kinerja']) : null,
            targetAnggaran: BigInt(Number(row['Target Anggaran']) || 0),
            realisasiKinerja: row['Realisasi Kinerja'] !== undefined ? Number(row['Realisasi Kinerja']) : null,
            realisasiAnggaran: cleanCurrency(row['Realisasi Anggaran']) || 0,
            capaianKinerja: row['Capaian (%) Kinerja'] !== undefined ? String(row['Capaian (%) Kinerja']).trim() : null,
            capaianAnggaran: row['Capaian (%) Anggaran '] !== undefined ? String(row['Capaian (%) Anggaran ']).trim() : null,
        }));

    if (detailData.length === 0) throw new Error("Tidak ada data valid di Excel Naseha Kami");
    await tx.realisasiNasehaKami.createMany({ data: detailData });
    return detailData.length;
};

export default process;