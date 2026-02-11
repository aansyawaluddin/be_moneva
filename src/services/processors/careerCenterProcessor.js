import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath, { cellDates: true });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Career Center kosong");

    const detailData = dataExcel.map(row => {
        let rawTanggal = row['Tanggal'] || row['Tanggal Kegiatan'];
        let finalDate = new Date(); 

        if (typeof rawTanggal === 'number') {
            finalDate = new Date(Math.round((rawTanggal - 25569) * 86400 * 1000));
        } else if (rawTanggal instanceof Date) {
            finalDate = rawTanggal;
        } else if (typeof rawTanggal === 'string') {
            finalDate = new Date(rawTanggal);
        }

        return {
            dataRealisasiId: headerId,
            namaKegiatan: row['Nama Kegiatan'] || row['Kegiatan'],
            lokasi: row['Lokasi'] || row['Tempat'] || '-',
            tanggalKegiatan: finalDate,
            nominal: cleanCurrency(row['Nominal'] || row['Biaya'])
        };
    });

    await tx.realisasiCareerCenter.createMany({ data: detailData });
    return detailData.length;
};

export default process;