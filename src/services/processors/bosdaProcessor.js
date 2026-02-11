import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel kosong atau tidak terbaca");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaSekolah: row['Nama Sekolah'] || 'Tanpa Nama',
        jumlahSiswa: Number(row['Jumlah Siswa']) || 0,
        kabupatenKota: row['Kabupaten'] || 'Palu',

        nominal: cleanCurrency(row['Nominal']),
    }));

    await tx.realisasiBosda.createMany({ data: detailData });

    return detailData.length;
};

export default process;