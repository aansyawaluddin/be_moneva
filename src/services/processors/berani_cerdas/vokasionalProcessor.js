import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);
    if (dataExcel.length === 0) throw new Error("File Excel Vokasional kosong");

    const detailData = dataExcel
        .filter(row => row['Rincian Kegiatan'] && String(row['Rincian Kegiatan']).trim() !== '')
        .map(row => {
            const targetAnggaran = Number(row['Target Anggaran']) || 0;
            const realisasiAnggaran = cleanCurrency(row['Realisasi Anggaran']);
            const capaianKinerja = row['Capaian (%) Kinerja'] !== undefined && row['Capaian (%) Kinerja'] !== null
                ? String(row['Capaian (%) Kinerja']).trim() : null;
            const capaianAnggaran = row['Capaian (%) Anggaran'] !== undefined && row['Capaian (%) Anggaran'] !== null
                ? String(row['Capaian (%) Anggaran']).trim() : null;
            return {
                dataRealisasiId: headerId,
                rincianKegiatan: String(row['Rincian Kegiatan']).trim(),
                kabupatenKota: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : null,
                satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
                targetKinerja: Number(row['Target Kinerja']) || 0,
                targetAnggaran: BigInt(targetAnggaran),
                realisasiKinerja: Number(row['Realisasi Kinerja']) || 0,
                realisasiAnggaran: isNaN(realisasiAnggaran) ? 0 : realisasiAnggaran,
                capaianKinerja,
                capaianAnggaran,
            };
        });

    if (detailData.length === 0) throw new Error("Tidak ada data valid di Excel Vokasional");
    await tx.realisasiVokasi.createMany({ data: detailData });
    return detailData.length;
};

export default process;
