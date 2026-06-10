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
            const targetRupiah = Number(row['Target Rupiah']) || 0;
            const realisasiRupiah = cleanCurrency(row['Realisasi Rupiah']);
            const capaianKinerja = row['Capaian (%) Kinerja'] !== undefined && row['Capaian (%) Kinerja'] !== null ? String(row['Capaian (%) Kinerja']).trim() : null;
            const capaianRupiah = row['Capaian (%) Rupiah'] !== undefined && row['Capaian (%) Rupiah'] !== null ? String(row['Capaian (%) Rupiah']).trim() : null;

            return {
                dataRealisasiId: headerId,
                rincianKegiatan: String(row['Rincian Kegiatan']).trim(),
                kabupatenKota: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : null,
                satuan: row['Satuan'] ? String(row['Satuan']).trim() : null,
                targetKinerja: Number(row['Target Kinerja']) || 0,
                targetRupiah: BigInt(targetRupiah),
                realisasiKinerja: Number(row['Realisasi Kinerja']) || 0,
                realisasiRupiah: isNaN(realisasiRupiah) ? 0 : realisasiRupiah,
                capaianKinerja: capaianKinerja,
                capaianRupiah: capaianRupiah,
            };
        });

    if (detailData.length === 0) throw new Error("Tidak ada data valid di Excel Vokasional");

    await tx.realisasiVokasi.createMany({ data: detailData });
    return detailData.length;
};

export default process;