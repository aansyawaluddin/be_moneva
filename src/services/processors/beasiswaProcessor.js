import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("Excel Beasiswa kosong");

    const detailData = dataExcel.map(row => {
        let parsedNominal = cleanCurrency(row['Nominal']);
        if (isNaN(parsedNominal) || !parsedNominal) parsedNominal = 0;

        return {
            dataRealisasiId: headerId,
            namaPenerima: String(row['Nama'] || row['Nama Penerima'] || '-').trim(),
            nik: String(row['NIK'] || '-').trim(),
            nim: String(row['NIM'] || row['No. Registrasi'] || '-').trim(),
            alamat: row['Alamat'] ? String(row['Alamat']).trim() : null,
            kabupaten: row['Kabupaten/Kota'] ? String(row['Kabupaten/Kota']).trim() : 'Palu',
            institusiTujuan: (row['Universitas'] || row['Sekolah']) ? String(row['Universitas'] || row['Sekolah']).trim() : '-',
            jalur: row['Jalur Pendaftaran'] ? String(row['Jalur Pendaftaran']).trim() : '-',
            nominal: parsedNominal,
            kontakPenerima: String(row['Kontak'] || '-').trim()
        };
    });

    await tx.realisasiBeasiswa.createMany({ data: detailData });

    return detailData.length;
};

export default process;