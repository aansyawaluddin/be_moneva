import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel SPP kosong atau tidak terbaca");

    const detailData = dataExcel.map(row => {
        const keys = Object.keys(row);

        const nominalSma = Number(cleanCurrency(row[keys[2]])) || 0;
        const nominalSmk = Number(cleanCurrency(row[keys[4]])) || 0;
        const nominalSlb = Number(cleanCurrency(row[keys[6]])) || 0;

        const totalNominal = nominalSma + nominalSmk + nominalSlb;

        return {
            dataRealisasiId: headerId,
            kabupatenKota: String(row[keys[0]] || '-').trim(),
            siswaSma: Number(row[keys[1]]) || 0,
            siswaSmk: Number(row[keys[3]]) || 0,
            siswaSlb: Number(row[keys[5]]) || 0,
            nominal: totalNominal
        };
    });

    await tx.realisasiSpp.createMany({ data: detailData });
    return detailData.length;
};

export default process;