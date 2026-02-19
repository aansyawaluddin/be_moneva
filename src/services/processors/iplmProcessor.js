import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel IPLM / Literasi kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaKegiatan: String(row['Nama Kegiatan'] || row['Kegiatan'] || row['Uraian Kegiatan'] || row['Nama'] || '-').trim(),
        lokasi: String(row['Lokasi'] || row['Tempat'] || '-').trim(),
        kabupatenKota: String(row['Kabupaten/Kota'] || row['Kabupaten'] || row['Kota'] || '-').trim(),
        jumlahOrang: Number(row['Jumlah Sasaran'] || row['Jumlah Orang'] || row['Jumlah'] || row['Peserta']) || 0,
        nominal: Number(cleanCurrency(row['Nominal'] || row['Biaya'] || row['Anggaran'])) || 0
    }));

    await tx.realisasiIplm.createMany({ data: detailData });
    return detailData.length;
};

export default process;