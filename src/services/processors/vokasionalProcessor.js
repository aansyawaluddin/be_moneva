import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Vokasi kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        rincianKegiatan: String(row['Rincian Kegiatan'] || '-').trim(),
        kabupatenKota: String(row['Kabupaten/Kota'] || row['Kabupaten'] || '-').trim(),
        jumlahOrang: Number(row['Jumlah Orang']) || 0,
        nominal: Number(cleanCurrency(row['Nominal'] || row['Biaya'])) || 0
    }));

    await tx.realisasiVokasi.createMany({ data: detailData });
    return detailData.length;
};

export default process;