import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Vokasi kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaPeserta: row['Nama Peserta'] || row['Nama'],
        nik: String(row['NIK'] || row['KTP'] || '-'),
        jenisPelatihan: row['Jenis Pelatihan'] || row['Pelatihan'] || '-',
        kabupatenKota: row['Kabupaten'] || '-',
        nominal: cleanCurrency(row['Nominal'] || row['Biaya'])
    }));

    await tx.realisasiVokasi.createMany({ data: detailData });
    return detailData.length;
};

export default process;