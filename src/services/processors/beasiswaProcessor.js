import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js'; 

const process = async (tx, headerId, filePath) => {
    // 1. Baca Excel
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("Excel Beasiswa kosong");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        namaPenerima: row['Nama'] || row['Nama Penerima'],
        noRegistrasi: String(row['NIM'] || row['No Registrasi'] || '-'),
        alamat: row['Alamat'] || null,
        kabupaten: row['Kabupaten'] || 'Palu',
        institusiTujuan: row['Kampus'] || row['Sekolah'],
        nominal: cleanCurrency(row['Nominal']),
        kontakPenerima: String(row['No HP'] || '-')
    }));

    await tx.realisasiBeasiswa.createMany({ data: detailData });
    
    return detailData.length;
};

export default process;