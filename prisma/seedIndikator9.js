import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const indikator9Data = [
    {
        programSlug: 'berani-sehat',
        indikator: [
            { nama: 'Indeks Modal Manusia (IMM)', satuan: 'Indeks', opd: 'Dinas Kesehatan dan Dinas Pendidikan' },
            { nama: 'Usia Harapan Hidup', satuan: 'Tahun', opd: 'Dinas Kesehatan' },
            { nama: 'Angka Kematian Ibu (Per 100.000 Kelahiran Hidup)', satuan: 'Persen', opd: 'Dinas Kesehatan' },
            { nama: 'Prevalensi Stunting (Pendek dan Sangat Pendek pada Balita)', satuan: 'Persen', opd: 'Dinas Kesehatan' },
            { nama: 'Cakupan Kepesertaan Jaminan Kesehatan Provinsi', satuan: 'Persen', opd: 'Dinas Kesehatan' },
        ]
    },
    {
        programSlug: 'berani-cerdas',
        indikator: [
            { nama: 'Rata – Rata Lama Sekolah Penduduk Usia di Atas 15 Tahun', satuan: 'Tahun', opd: 'Dinas Pendidikan' },
            { nama: 'Harapan Lama Sekolah', satuan: 'Tahun', opd: 'Dinas Pendidikan' },
            { nama: 'Nilai Literasi', satuan: 'Persen', opd: 'Dinas Pendidikan' },
            { nama: 'Nilai Numerasi', satuan: 'Persen', opd: 'Dinas Pendidikan' },
            { nama: 'Angka Partisipasi Sekolah (APS) SMA Sederajat', satuan: 'Angka', opd: 'Dinas Pendidikan' },
            { nama: 'Proporsi Penduduk Berusia 15 Tahun Keatas yang Berkualitas Pendidikan Tinggi', satuan: 'Persen', opd: 'Dinas Pendidikan' },
            { nama: 'Persentase Pekerja Lulusan Pendidikan Menengah dan Tinggi yang Bekerja di Bidang Keahlian', satuan: 'Persen', opd: 'Dinas Pendidikan' },
            { nama: 'Indeks Pembangunan Literasi Masyarakat', satuan: 'Indeks', opd: 'Dinas Pendidikan' },
        ]
    },
    {
        programSlug: 'berani-sejahtera',
        indikator: [
            { nama: 'Indeks Pembangunan Keluarga', satuan: 'Indeks', opd: 'Dinas P2KB' },
            { nama: 'Tingkat Kemiskinan', satuan: 'Persen', opd: 'Dinas Sosial' },
            { nama: 'Indeks Kesejahteraan Sosial', satuan: 'Indeks', opd: 'Dinas Sosial' },
            { nama: 'Prevalensi Ketidakcukupan Konsumsi Pangan (Prevalence of Undernourishment) (%)', satuan: 'Persen', opd: 'Dinas Pangan' },
            { nama: 'Tingkat Inflasi', satuan: 'Persen', opd: 'Biro Ekonomi' },
        ]
    },
    {
        programSlug: 'berani-harmoni',
        indikator: [
            { nama: 'Indeks Desa', satuan: 'Indeks', opd: 'Dinas PMD' },
            { nama: 'Tingkat Pengangguran Terbuka', satuan: 'Persen', opd: 'Dinas Tenaga Kerja' },
            { nama: 'Proporsi Penciptaan Lapangan Kerja Formal', satuan: 'Persen', opd: 'Dinas Tenaga Kerja' },
            { nama: 'Indeks Pembangunan Gender', satuan: 'Indeks', opd: 'Dinas P3A' },
            { nama: 'Cakupan Kepesertaan Jaminan Sosial Ketenagakerjaan Provinsi', satuan: 'Persen', opd: 'Dinas Tenaga Kerja' },
            { nama: 'Pertumbuhan Ekonomi', satuan: 'Persen', opd: 'Biro Ekonomi' },
            { nama: 'Nilai Investasi', satuan: 'Rp Juta', opd: 'Dinas PM PTSP' },
            { nama: 'Pembentukan Modal Tetap Bruto (% PDRB)', satuan: '% PDRB', opd: 'Dinas PM PTSP' },
        ]
    },
    {
        programSlug: 'berani-makmur',
        indikator: [
            { nama: 'Rasio PDRB Industri Pengolahan (%)', satuan: 'Persen', opd: 'Dinas Perindustrian dan Perdagangan' },
            { nama: 'PDRB Sektor Pertanian, Kehutanan dan Perikanan', satuan: 'Persen', opd: 'Dinas Pertanian, Kehutanan dan Perikanan' },
            { nama: 'PDRB Sektor Pertambangan dan Penggalian', satuan: 'Milyar Rupiah', opd: 'Dinas ESDM' },
            { nama: 'Indeks Kualitas Lingkungan Hidup Daerah', satuan: 'Indeks', opd: 'Dinas Lingkungan Hidup' },
            { nama: 'Indeks Pengelolaan Keanekaragaman Hayati Daerah', satuan: 'Indeks', opd: 'Dinas Kehutanan' },
            { nama: 'Penurunan Intensitas Emisi GRK', satuan: 'Persen', opd: 'Dinas ESDM' },
            { nama: 'Persentase Penurunan Emisi GRK: Kumulatif', satuan: 'Persen', opd: 'Dinas ESDM' },
            { nama: 'Persentase Penurunan Emisi GRK: Tahunan', satuan: 'Persen', opd: 'Dinas ESDM' },
            { nama: 'Persentase Ketaatan RTRW', satuan: 'Persen', opd: 'Dinas Bina Marga' },
        ]
    },
    {
        programSlug: 'berani-lancar',
        indikator: [
            { nama: 'Indeks Infrastruktur Daerah', satuan: 'Indeks', opd: 'Dinas Bina Marga' },
            { nama: 'Indeks Kepuasan Layanan Infrastruktur Jalan dan Jembatan', satuan: 'Indeks', opd: 'Dinas Bina Marga' },
            { nama: 'Indeks Kepuasan Layanan Infrastruktur Keciptakaryaan dan SDA', satuan: 'Indeks', opd: 'Dinas Bina Marga' },
            { nama: 'Kapasitas Air Baku', satuan: 'm3/detik', opd: 'Dinas Cikasda' },
            { nama: 'Indeks Kepuasan Layanan Infrastruktur Perumahan dan Kawasan Permukiman', satuan: 'Indeks', opd: 'Dinas Perkimtan' },
            { nama: 'Persentase Rumah Tangga dengan Akses Hunian Layak, Terjangkau dan Berkelanjutan', satuan: 'Persen', opd: 'Dinas Perkimtan' },
            { nama: 'Persentase Rumah Tangga Hunian Layak', satuan: 'Persen', opd: 'Dinas Perkimtan' },
            { nama: 'Akses Rumah Tangga Perkotaan terhadap Air Siap Minum Perpipaan', satuan: 'Persen', opd: 'Dinas Cikasda' },
            { nama: 'Persentase Rumah Tangga terhadap Akses Air Bersih', satuan: 'Persen', opd: 'Dinas Cikasda' },
            { nama: 'Persentase Rumah Tangga dengan Akses Sanitasi Aman', satuan: 'Persen', opd: 'Dinas Cikasda' },
            { nama: 'Rasio Konektivitas Simpul Transportasi Provinsi', satuan: 'Rasio', opd: 'Dinas Bina Marga' },
        ]
    },
    {
        programSlug: 'berani-menyala',
        indikator: [
            { nama: 'Konsumsi Listrik Per Kapita', satuan: 'Kwh/kapita', opd: 'Dinas ESDM' },
        ]
    },
    {
        programSlug: 'berani-berintegritas',
        indikator: [
            { nama: 'Indeks Pelayanan Publik', satuan: 'Indeks', opd: 'Setda' },
            { nama: 'Indeks Reformasi Hukum', satuan: 'Indeks', opd: 'Setda' },
            { nama: 'Indeks Kualitas Kebijakan', satuan: 'Indeks', opd: 'Setda' },
            { nama: 'Nilai SAKIP', satuan: 'Nilai', opd: 'Biro Organisasi' },
            { nama: 'Indeks Sistem Pemerintahan Berbasis Elektronik', satuan: 'Indeks', opd: 'Kominfo' },
            { nama: 'Indeks Perencanaan Pembangunan Nasional/Daerah', satuan: 'Indeks', opd: 'Bappeda' },
            { nama: 'Indeks Integritas Nasional (Survei Penilaian Integritas/SPIP)', satuan: 'Indeks', opd: 'Inspektorat' },
            { nama: 'Indeks Profesionalitas ASN', satuan: 'Indeks', opd: 'BKD' },
            { nama: 'Tingkat Digitalisasi Arsip', satuan: 'Indeks', opd: 'Perpustakaan' },
            { nama: 'Indeks Inovasi Daerah', satuan: 'Indeks', opd: 'Brida' },
            { nama: 'Indeks Inklusi Keuangan', satuan: 'Indeks', opd: 'BPKAD' },
            { nama: 'Indeks Pengelolaan Keuangan Daerah (IPKD)', satuan: 'Indeks', opd: 'BPKAD' },
            { nama: 'Indeks Reformasi Birokrasi', satuan: 'Indeks', opd: 'Biro Organisasi' },
        ]
    },
    {
        programSlug: 'berani-berkah',
        indikator: [
            { nama: 'Indeks Kerukunan Umat Beragama', satuan: 'Indeks', opd: 'Dinas Kebudayaan' },
            { nama: 'Indeks Ketentraman dan Ketertiban Umum', satuan: 'Indeks', opd: 'Satpolpp' },
            { nama: 'Indeks Demokrasi Provinsi', satuan: 'Indeks', opd: 'Kesbangpol' },
            { nama: 'Indeks Pembangunan Kebudayaan', satuan: 'Indeks', opd: 'Dinas Kebudayaan' },
        ]
    },
];

async function main() {
    console.log('🌱 Seeding Super Admin & Indikator 9 Berani...\n');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('superadmin123', salt);

    const existingSuperAdmin = await prisma.user.findUnique({
        where: { username: 'superadmin' }
    });

    let superAdmin;
    if (!existingSuperAdmin) {
        superAdmin = await prisma.user.create({
            data: {
                username: 'superadmin',
                password: password,
                role: 'Super Admin',
                dinas: 'Bappeda / Sekretariat',
                kontak: '08100000000',
                programKerjaId: null
            }
        });
        console.log('✅ Super Admin berhasil dibuat:');
    } else {
        superAdmin = existingSuperAdmin;
        console.log('ℹ️  Super Admin sudah ada, skip:');
    }
    console.log(`   👤 Username : superadmin`);
    console.log(`   🔑 Password : superadmin123`);
    console.log(`   🎭 Role     : Super Admin\n`);

    console.log('📋 Menyeeding Indikator 9 Berani...\n');

    let totalIndikator = 0;

    for (const item of indikator9Data) {
        const program = await prisma.programKerja.findUnique({
            where: { slug: item.programSlug }
        });

        if (!program) {
            console.log(`⚠️  Program tidak ditemukan: ${item.programSlug} → skip`);
            continue;
        }

        console.log(`📂 [${program.namaProgram}]`);

        for (const ind of item.indikator) {

            const existing = await prisma.indikator9.findFirst({
                where: {
                    programKerjaId: program.id,
                    namaIndikator: ind.nama
                }
            });

            if (!existing) {
                await prisma.indikator9.create({
                    data: {
                        programKerjaId: program.id,
                        namaIndikator: ind.nama,
                        satuan: ind.satuan,
                        opd: ind.opd
                    }
                });
                console.log(`   ✓ ${ind.nama.substring(0, 60)}...`);
            } else {
                console.log(`   → (sudah ada) ${ind.nama.substring(0, 55)}...`);
            }

            totalIndikator++;
        }

        console.log();
    }

    const jumlahIndikator = await prisma.indikator9.count();

    console.log('==============================================');
    console.log('✅ SEEDING INDIKATOR 9 SELESAI!');
    console.log(`📊 Total Indikator di DB : ${jumlahIndikator}`);
    console.log(`📋 Total dari file ini   : ${totalIndikator}`);
    console.log('👤 Super Admin  : superadmin / superadmin123');
    console.log('==============================================');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });