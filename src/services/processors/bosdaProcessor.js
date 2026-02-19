import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel BOSDA kosong atau tidak terbaca");

    const detailData = dataExcel.map(row => ({
        dataRealisasiId: headerId,
        kabupatenKota: String(row['Kabupaten/Kota'] || row['Kabupaten'] || '-').trim(),
        smaNegeri: Number(row['SMA Negeri']) || 0,
        smaSwasta: Number(row['SMA Swasta']) || 0,
        smk: Number(row['SMK']) || 0,
        slbNegeri: Number(row['SLB Negeri']) || 0,
        slbSwasta: Number(row['SLB Swasta']) || 0,
        nominal: Number(cleanCurrency(row['Nominal'])) || 0
    }));

    await tx.realisasiBosda.createMany({ data: detailData });

    return detailData.length;
};

export default process;