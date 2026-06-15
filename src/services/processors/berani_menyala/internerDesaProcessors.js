import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);
    if (dataExcel.length === 0) throw new Error("File Excel Internet Desa kosong");

    const detailData = dataExcel
        .filter(row => row['Nama Program'] && String(row['Nama Program']).trim() !== '')
        .map(row => {
            const targetAnggaran = Number(row['Target Anggaran']) || 0;
            const realisasiAnggaran = cleanCurrency(row['Realisasi Anggaran']);
            const capaianKinerja = row['Capaian (%) Kinerja'] !== undefined && row['Capaian (%) Kinerja'] !== null
                ? String(row['Capaian (%) Kinerja']).trim() : null;
            const capaianAnggaran = row['Capaian (%) Anggaran '] !== undefined && row['Capaian (%) Anggaran '] !== null
                ? String(row['Capaian (%) Anggaran ']).trim()
                : row['Capaian (%) Anggaran'] !== undefined && row['Capaian (%) Anggaran'] !== null
                    ? String(row['Capaian (%) Anggaran']).trim() : null;
            return {
                dataRealisasiId: headerId,
                namaProgram: String(row['Nama Program']).trim(),
                kabupatenKota: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : null,
                satuan: row['Satuan '] ? String(row['Satuan ']).trim()
                    : row['Satuan'] ? String(row['Satuan']).trim() : null,
                targetKinerja: Number(row['Target Kinerja']) || 0,
                targetAnggaran: BigInt(targetAnggaran),
                realisasiKinerja: Number(row['Realisasi Kinerja']) || 0,
                realisasiAnggaran: isNaN(realisasiAnggaran) ? 0 : realisasiAnggaran,
                capaianKinerja,
                capaianAnggaran,
            };
        });

    if (detailData.length === 0) throw new Error("Tidak ada data valid di Excel Internet Desa");
    await tx.realisasiInternetDesa.createMany({ data: detailData });
    return detailData.length;
};

export default process;