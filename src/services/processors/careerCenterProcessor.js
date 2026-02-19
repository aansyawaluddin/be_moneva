import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Career Center kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaKegiatan: String(row['Nama Kegiatan'] || '-').trim(),
        lokasi: String(row['Lokasi'] || '-').trim(),
        kabupatenKota: String(row['Kabupaten/Kota'] || '-').trim(),
        jumlahOrang: Number(row['Jumlah Orang']) || 0,
        nominal: Number(cleanCurrency(row['Nominal'] || row['Biaya'])) || 0
    }));

    await tx.realisasiCareerCenter.createMany({ data: detailData });
    return detailData.length;
};

export default process;