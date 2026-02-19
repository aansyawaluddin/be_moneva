import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Prakerin kosong");

    const detailData = dataExcel.map(row => {
        return {
            dataRealisasiId: headerId,
            kabupatenKota: String(row['Kabupaten/Kota'] || row['Kabupaten'] || '-').trim(),
            smkNegeri: Number(row['SMK Negeri']) || 0,
            realisasiNegeri: Number(cleanCurrency(row['Realisasi Negeri'])) || 0,
            smkSwasta: Number(row['SMK Swasta']) || 0,
            realisasiSwasta: Number(cleanCurrency(row['Realisasi Swasta'])) || 0
        };
    });

    await tx.realisasiPrakerin.createMany({ data: detailData });
    return detailData.length;
};

export default process;