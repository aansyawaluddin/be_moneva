import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel SPP kosong atau tidak terbaca");

    const detailData = dataExcel.map(row => {
        const getVal = (keys) => {
            for (let key of keys) {
                if (row[key] !== undefined) return row[key];
                if (row[key + ' '] !== undefined) return row[key + ' '];
                if (row[' ' + key] !== undefined) return row[' ' + key];
            }
            return null;
        };

        const jmlSma = Number(getVal(['Jumlah Siswa SMA', 'Siswa SMA'])) || 0;
        const jmlSmk = Number(getVal(['Jumlah Siswa SMK', 'Siswa SMK'])) || 0;
        const jmlSlb = Number(getVal(['Jumlah Siswa SLB', 'Siswa SLB'])) || 0;

        const nominalSma = Number(cleanCurrency(getVal(['Realisasi SMA', 'Nominal SMA']) || 0));
        const nominalSmk = Number(cleanCurrency(getVal(['Realisasi SMK', 'Nominal SMK']) || 0));
        const nominalSlb = Number(cleanCurrency(getVal(['Realisasi SLB', 'Nominal SLB']) || 0));

        const totalNominal = nominalSma + nominalSmk + nominalSlb;

        return {
            dataRealisasiId: headerId,
            kabupatenKota: String(getVal(['Kabupaten/Kota', 'Kabupaten', 'Kota']) || '-').trim(),
            siswaSma: jmlSma,
            realisasiSma: nominalSma,
            siswaSmk: jmlSmk,
            realisasiSmk: nominalSmk,
            siswaSlb: jmlSlb,
            realisasiSlb: nominalSlb,
            nominal: totalNominal
        };
    });

    await tx.realisasiSpp.createMany({ data: detailData });
    return detailData.length;
};

export default process;