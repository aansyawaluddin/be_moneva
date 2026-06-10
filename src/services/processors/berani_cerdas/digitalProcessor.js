import xlsx from 'xlsx';
import { cleanCurrency } from '../../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel Digitalisasi kosong");

    const detailData = dataExcel
        .filter(row => row['Bidang'] && String(row['Bidang']).trim() !== '')
        .map(row => {
            const totalPaguRaw = Number(row['Total Pagu']) || 0;
            const realisasi = cleanCurrency(row['Realisasi']);
            const sisa = cleanCurrency(row['Sisa']);

            return {
                dataRealisasiId: headerId,
                bidang: String(row['Bidang']).trim(),
                jumlahSekolah: Number(row['Jumlah Sekolah']) || 0,
                jumlahSiswa: Number(row['Jumlah Siswa']) || 0,
                totalPagu: BigInt(totalPaguRaw),
                realisasi: isNaN(realisasi) ? 0 : realisasi,
                sisa: isNaN(sisa) ? 0 : sisa,
            };
        });

    if (detailData.length === 0) throw new Error("Tidak ada data valid di Excel Digitalisasi");

    await tx.realisasiDigital.createMany({ data: detailData });
    return detailData.length;
};

export default process;