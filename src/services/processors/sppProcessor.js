import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel SPP kosong");

    const detailData = dataExcel.map(row => {
        const rawJumlah = row['Jumlah Siswa'] || row['Jumlah'] || 0;
        const jumlahSiswa = parseInt(rawJumlah, 10) || 0;

        return {
            dataRealisasiId: headerId,
            namaSekolah: row['Nama Sekolah'] || row['Sekolah'],
            jumlahSiswa: jumlahSiswa,
            kabupatenKota: row['Kabupaten'] || row['Kabupaten/Kota'] || '-',
            nominal: cleanCurrency(row['Nominal'] || row['Biaya SPP'] || row['Total Bantuan'])
        };
    });

    await tx.realisasiSpp.createMany({ data: detailData });
    return detailData.length;
};

export default process;