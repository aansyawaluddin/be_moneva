import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("Excel Beasiswa Cerdas Istimewa kosong");

    const detailData = dataExcel.map(row => {
        const totalPaguRaw = Number(row['Total Pagu']) || 0;
        const realisasi = cleanCurrency(row['Realisasi']);
        const sisa = cleanCurrency(row['Sisa']);

        return {
            dataRealisasiId: headerId,
            bidang: String(row['Bidang'] || '-').trim(),
            jumlahSiswa: Number(row['Jumlah Siswa']) || 0,
            totalPagu: BigInt(totalPaguRaw),
            realisasi: isNaN(realisasi) ? 0 : realisasi,
            sisa: isNaN(sisa) ? 0 : sisa,
        };
    });

    await tx.realisasiBeasiswaCerdas.createMany({ data: detailData });

    return detailData.length;
};

export default process;