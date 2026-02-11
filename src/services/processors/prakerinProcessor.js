import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Prakerin kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaSekolah: row['Nama Sekolah'] || row['Sekolah'],
        jumlahSiswa: Number(row['Jumlah Siswa'] || row['Peserta']) || 0,
        kabupatenKota: row['Kabupaten'] || '-',
        nominal: cleanCurrency(row['Nominal'] || row['Biaya'])
    }));

    await tx.realisasiPrakerin.createMany({ data: detailData });
    return detailData.length;
};

export default process;