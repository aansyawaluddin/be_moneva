import xlsx from 'xlsx';
import { cleanCurrency } from '../../utils/helper.js';

const process = async (tx, headerId, filePath) => {
    // 1. Baca Excel
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet);

    if (dataExcel.length === 0) throw new Error("File Excel BOSDA kosong");

    // 2. Mapping Data dengan Validasi & Alias
    const detailData = dataExcel.map(row => {
        // Cek variasi nama kolom (Case Insensitive & Alias umum)
        const namaSekolah = row['Nama Sekolah'] || row['Sekolah'] || row['nama sekolah'] || row['Nama Satuan Pendidikan'];
        const kabKota = row['Kabupaten'] || row['Kota'] || row['Kab/Kota'] || row['Kabupaten/Kota'] || row['kabupaten'];
        const jmlSiswa = row['Jumlah Siswa'] || row['Siswa'] || row['Jml Siswa'] || row['jumlah siswa'];
        const pagu = row['Total Pagu'] || row['Pagu'] || row['Anggaran'] || row['total pagu'];
        const realisasi = row['Realisasi'] || row['Pencairan'] || row['Dana Cair'] || row['realisasi'];

        // Validasi: Jika nama sekolah kosong, data ini dianggap tidak valid (skip atau error)
        // Di sini kita kasih string '-' atau throw error jika mau ketat
        if (!namaSekolah) {
            console.warn("Baris dilewati karena Nama Sekolah tidak ditemukan:", row);
            return null; // Nanti kita filter null
        }

        return {
            dataRealisasiId: headerId,
            namaSekolah: String(namaSekolah).trim(), // Pastikan String & Hapus spasi berlebih
            kabupatenKota: kabKota ? String(kabKota).trim() : null,
            jumlahSiswa: Number(jmlSiswa) || 0,
            totalPagu: cleanCurrency(pagu),
            realisasi: cleanCurrency(realisasi)
        };
    }).filter(item => item !== null); // Hapus baris yang null (tidak valid)

    if (detailData.length === 0) {
        throw new Error("Tidak ada data valid yang bisa dibaca. Pastikan format kolom Excel benar: 'Nama Sekolah', 'Kabupaten', 'Jumlah Siswa', 'Total Pagu', 'Realisasi'.");
    }

    // 3. Insert ke Database
    await tx.realisasiBosda.createMany({ 
        data: detailData 
    });

    return detailData.length;
};

export default process;