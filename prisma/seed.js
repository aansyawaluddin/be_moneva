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

async function main() {
  console.log('🌱 Memulai Seeding Database...');

  // 1. BERSIHKAN DATABASE
  // Hapus detail
  await prisma.realisasiBosda.deleteMany();
  await prisma.realisasiSpp.deleteMany();
  await prisma.realisasiPrakerin.deleteMany();
  await prisma.realisasiBeasiswa.deleteMany();
  await prisma.realisasiDigital.deleteMany();
  await prisma.realisasiVokasi.deleteMany();
  await prisma.realisasiCareerCenter.deleteMany();
  await prisma.realisasiSeragam.deleteMany();

  // Hapus header & master
  await prisma.dataRealisasi.deleteMany();
  await prisma.accessToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subProgramKerja.deleteMany();
  await prisma.programKerja.deleteMany();

  console.log('🧹 Database lama telah dibersihkan.');

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('123', salt);

  // ============================================================
  // PROGRAM BERANI CERDAS
  // ============================================================
  const beraniCerdas = {
    namaProgram: 'Berani Cerdas',
    deskripsi: 'Bantuan pendidikan tuntas dari SD hingga Perguruan Tinggi.',
    subPrograms: [
      { nama: 'Pemberian BOSDA bagi SMA, SMK dan SLB', code: 'bosda', target: 500, anggaran: 42000000000 },
      { nama: 'Pemberian biaya SPP bagi siswa miskin di sekolah swasta', code: 'spp', target: 1000, anggaran: 5000000000 },
      { nama: 'Biaya uji kompetensi dan biaya prakerin SMK', code: 'prakerin', target: 3000, anggaran: 3000000000 },
      { nama: 'Pemberian beasiswa dan bantuan pendidikan', code: 'beasiswa', target: 28000, anggaran: 266120507972 },
      { nama: 'Perbaikan sarana digital SMA/SMK', code: 'digital', target: 100, anggaran: 15000000000 },
      { nama: 'Pelatihan Vokasional Siap Kerja', code: 'vokasi', target: 5000, anggaran: 10000000000 },
      { nama: 'Sulteng Career Center', code: 'career', target: 1, anggaran: 2000000000 },
      { nama: 'Bantuan Seragam Sekolah (SMA)', code: 'seragam', target: 10000, anggaran: 6500000000 }
    ]
  };

  const otherPrograms = [
    {
      namaProgram: 'Berani Sehat',
      deskripsi: 'Layanan kesehatan gratis dan berkualitas.',
      subPrograms: [
        { nama: 'Integrasi Layanan Kesehatan BPJS', code: 'bpjs', target: 0, anggaran: 50000000000 },
        { nama: 'Penanganan Stunting', code: 'stunting', target: 0, anggaran: 10000000000 },
        { nama: 'Pemeriksaan Kesehatan Gratis', code: 'cek_kesehatan', target: 0, anggaran: 5000000000 },
        { nama: 'Peningkatan Layanan RS Undata & Madani', code: 'rs_rujukan', target: 0, anggaran: 20000000000 },
        { nama: 'Jaminan Kesehatan Masyarakat Miskin (Naseha Kami)', code: 'naseha_kami', target: 0, anggaran: 15000000000 },
        { nama: 'Integrasi Layanan RS Kota Palu', code: 'rs_palu', target: 0, anggaran: 5000000000 }
      ]
    },
    {
      namaProgram: 'Berani Sejahtera',
      deskripsi: 'Stabilitas ekonomi dan pangan.',
      subPrograms: [
        { nama: 'Jaminan Harga Bahan Pokok', code: 'harga_pokok', target: 0, anggaran: 10000000000 },
        { nama: 'Program Pangan Daerah (PANADA)', code: 'panada', target: 0, anggaran: 15000000000 },
        { nama: 'Program Usaha Ekonomi Produktif (UEP)', code: 'uep', target: 0, anggaran: 8000000000 },
        { nama: 'Revitalisasi Rutilahu', code: 'rutilahu', target: 0, anggaran: 25000000000 },
        { nama: 'Pelatihan Kewirausahaan & UMKM', code: 'umkm', target: 0, anggaran: 5000000000 }
      ]
    },
    {
      namaProgram: 'Berani Menyala',
      deskripsi: 'Akses listrik dan internet merata.',
      subPrograms: [
        { nama: 'Jaminan Internet Desa (Blank Spot)', code: 'internet', target: 686, anggaran: 30000000000 },
        { nama: 'Listrik Masuk Desa & PJU', code: 'listrik', target: 0, anggaran: 40000000000 },
        { nama: 'Peningkatan PLTA Sulewana Poso', code: 'plta', target: 0, anggaran: 10000000000 }
      ]
    },
    {
      namaProgram: 'Berani Lancar',
      deskripsi: 'Konektivitas infrastruktur jalan dan jembatan.',
      subPrograms: [
        { nama: 'Peningkatan Konektivitas Antarwilayah', code: 'konektivitas', target: 0, anggaran: 50000000000 },
        { nama: 'Jalan Penghubung Barat - Timur', code: 'jalan_trans', target: 0, anggaran: 80000000000 },
        { nama: 'Rekonstruksi Jalan (MYC)', code: 'jalan_myc', target: 0, anggaran: 200000000000 },
        { nama: 'Kawasan Agropolitan', code: 'agropolitan', target: 0, anggaran: 15000000000 },
        { nama: 'Gawalise International Stadium (GIS)', code: 'gis', target: 0, anggaran: 150000000000 },
        { nama: 'Air Bersih Pedesaan', code: 'air_bersih', target: 0, anggaran: 10000000000 }
      ]
    },
    {
      namaProgram: 'Berani Makmur',
      deskripsi: 'Kesejahteraan petani dan nelayan.',
      subPrograms: [
        { nama: 'Program Petani Milenial', code: 'petani_milenial', target: 0, anggaran: 5000000000 },
        { nama: 'Modernisasi Alsintan & Pupuk', code: 'alsintan', target: 0, anggaran: 20000000000 },
        { nama: 'Program Resi Gudang', code: 'resi_gudang', target: 0, anggaran: 5000000000 },
        { nama: 'Bantuan Alat Tangkap Nelayan', code: 'nelayan', target: 0, anggaran: 10000000000 },
        { nama: 'Jaminan Sosial Petani & Nelayan', code: 'jamsos_tani', target: 0, anggaran: 15000000000 },
        { nama: 'Pembangunan Sentra Pangan', code: 'sentra_pangan', target: 0, anggaran: 10000000000 }
      ]
    },
    {
      namaProgram: 'Berani Berkah',
      deskripsi: 'Kehidupan beragama yang harmonis.',
      subPrograms: [
        { nama: 'Sulteng Berjamaah', code: 'sulteng_berjamaah', target: 0, anggaran: 2000000000 },
        { nama: 'Insentif Tokoh Agama & Adat', code: 'insentif_agama', target: 0, anggaran: 10000000000 },
        { nama: 'Penyetaraan Pesantren & Madrasah', code: 'pesantren', target: 0, anggaran: 5000000000 },
        { nama: 'Perbaikan Sarana Keagamaan', code: 'sarana_agama', target: 0, anggaran: 15000000000 }
      ]
    },
    {
      namaProgram: 'Berani Harmoni',
      deskripsi: 'Pariwisata, budaya, dan ekonomi kreatif.',
      subPrograms: [
        { nama: 'Wisata Desa & Geopark', code: 'wisata', target: 0, anggaran: 10000000000 },
        { nama: 'Pelestarian Budaya & Bahasa', code: 'budaya', target: 0, anggaran: 3000000000 },
        { nama: 'Sulteng Creative Hub', code: 'creative', target: 0, anggaran: 5000000000 },
        { nama: 'Inkubasi UMKM & Wirausaha Baru', code: 'inkubasi', target: 20000, anggaran: 10000000000 },
        { nama: 'Berani Investasi', code: 'investasi', target: 0, anggaran: 2000000000 }
      ]
    },
    {
      namaProgram: 'Berani Berintegritas',
      deskripsi: 'Reformasi birokrasi dan pelayanan publik.',
      subPrograms: [
        { nama: 'Tim Gaspoll (Call Center)', code: 'gaspoll', target: 0, anggaran: 1000000000 },
        { nama: 'Super Apps Si-Berani', code: 'super_apps', target: 0, anggaran: 5000000000 },
        { nama: 'Budaya Kerja Birokrasi', code: 'birokrasi', target: 0, anggaran: 1000000000 },
        { nama: 'Bantuan Keuangan Desa', code: 'keuangan_desa', target: 0, anggaran: 50000000000 }
      ]
    }
  ];

  const allPrograms = [beraniCerdas, ...otherPrograms];

  for (const prog of allPrograms) {
    const programDB = await prisma.programKerja.create({
      data: {
        namaProgram: prog.namaProgram,
        slug: slugify(prog.namaProgram),
        deskripsi: prog.deskripsi
      }
    });

    console.log(`🚀 Program: ${prog.namaProgram}`);

    for (const sub of prog.subPrograms) {
      const subProgramDB = await prisma.subProgramKerja.create({
        data: {
          programKerjaId: programDB.id,
          namaSubProgram: sub.nama,
          slug: slugify(sub.nama),
          target: sub.target,
          anggaran: BigInt(sub.anggaran)
        }
      });

      await prisma.user.create({
        data: {
          username: `kadis_${sub.code}`,
          password: password,
          role: 'Kepala Dinas',
          kontak: '08123456789',
          subProgramId: subProgramDB.id
        }
      });

      await prisma.user.create({
        data: {
          username: `staff_${sub.code}`,
          password: password,
          role: 'Staff',
          kontak: '08123456789',
          subProgramId: subProgramDB.id
        }
      });

      console.log(`   - Sub: ${sub.nama}`);
    }
  }

  // Create User Gubernur
  await prisma.user.create({
    data: {
      username: 'gubernur',
      password: password,
      role: 'Gubernur',
      kontak: '0811111111',
      subProgramId: null
    }
  });

  console.log('\n==============================================');
  console.log('✅ SEEDING SELESAI!');
  console.log('🔑 Password Default: 123');
  console.log('👤 User Gubernur: gubernur');
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