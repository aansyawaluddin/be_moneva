import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("Excel Beasiswa Miskin/Berprestasi kosong");

    const detailData = dataExcel.map(row => {
        const targetRupiah = Number(row['Target Rupiah']) || 0;
        const realisasiRupiah = cleanCurrency(row['Realisasi Rupiah']);
        const capaianRupiah = row['Capaian Rupiah '] ? String(row['Capaian Rupiah ']).trim() : null;

        return {
            dataRealisasiId: headerId,
            rincianKegiatan: String(row['Rincian Kegiatan'] || '-').trim(),
            kabupaten: String(row['Kabupaten'] || '-').trim(),
            targetKinerja: Number(row['Target Kinerja ']) || 0,
            targetRupiah: BigInt(targetRupiah),
            realisasiKinerja: Number(row['Realisasi Kinerja']) || 0,
            realisasiRupiah: isNaN(realisasiRupiah) ? 0 : realisasiRupiah,
            capaianKinerja: Number(row['Capaian Kinerja']) || 0,
            capaianRupiah: capaianRupiah,
        };
    });

    await tx.realisasiBeasiswaMiskin.createMany({ data: detailData });

    return detailData.length;
};

export default process;