import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Digitalisasi kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaSekolah: row['Nama Sekolah'] || row['Sekolah'],
        jenisBarang: row['Jenis Barang'] || row['Barang'] || 'Perangkat IT',
        jumlahUnit: Number(row['Jumlah Unit'] || row['Unit']) || 0,
        kabupatenKota: row['Kabupaten'] || '-',
        nominal: cleanCurrency(row['Nominal'] || row['Harga'])
    }));

    await tx.realisasiDigital.createMany({ data: detailData });
    return detailData.length;
};

export default process;