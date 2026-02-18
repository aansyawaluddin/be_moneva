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
  const tables = [
    'realisasi_bosda', 'realisasi_spp', 'realisasi_prakerin',
    'realisasi_beasiswa', 'realisasi_digital', 'realisasi_vokasi',
    'realisasi_career_center', 'realisasi_seragam',
    'data_realisasi', 'access_tokens', 'users',
    'sub_program_kerja', 'program_kerja'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    } catch (e) {
      console.log(`⚠️ Skip clean table ${table}: ${e.message}`);
    }
  }

  console.log('🧹 Database lama telah dibersihkan.');

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('123', salt);

  // ============================================================
  // DATA MASTER SESUAI EXCEL (TIDAK ADA NAMA YANG DIPOTONG)
  // ============================================================

  const allProgramsData = [
    {
      namaProgram: 'Berani Cerdas',
      deskripsi: 'Bantuan pendidikan tuntas dari SD hingga Perguruan Tinggi.',
      dinas: 'Dinas Pendidikan',
      usernameKadis: 'kadis_pendidikan',
      subPrograms: [
        { nama: 'Pemberian BOSDA bagi SMA, SMK dan SLB negeri maupun swasta', target: 449, anggaran: 41478600000 },
        { nama: 'Pemberian biaya SPP bagi siswa miskin di sekolah swasta SMA/SMK/SLB', target: 1406, anggaran: 3120400000 },
        { nama: 'Pemberian beasiswa bagi siswa cerdas, istimewa dan bakat istimewa', target: 0, anggaran: 0 },
        { nama: 'Biaya uji kompetensi dan biaya prakerin bagi siswa SMK negeri maupun swasta', target: 148, anggaran: 27135331804 },
        { nama: 'Pemberian beasiswa dan bantuan biaya pendidikan bagi mahasiswa miskin dan/atau berprestasi', target: 28016, anggaran: 266120507972 },
        { nama: 'Pemberian bantuan biaya pendidikan bagi mahasiswa aktif miskin dan/atau berprestasi dalam masa penyelesaian studi', target: 0, anggaran: 0 },
        { nama: 'Pemberian beasiswa dan bantuan biaya pendidikan bagi guru, ASN serta pendidikan profesi', target: 112, anggaran: 324933676000 },
        { nama: 'Perbaikan dan peningkatan sarana dan prasarana pendidikan berbasis Digital SMA/SMK', target: 0, anggaran: 0 },
        { nama: 'Pelatihan “Vokasional Siap Kerja” bagi Generasi Milenial dan Gen-Z', target: 50, anggaran: 429334900 },
        { nama: 'Sulteng Career Center', target: 200, anggaran: 131316100 },
        { nama: 'Peningkatan minat baca dan budaya literasi masyarakat dengan mendorong kenaikan Indeks Pembangunn Literasi Masyarakat (IPLM)', target: 100, anggaran: 1371863571 },
        { nama: 'Bantuan Pemberian Seragam Sekolah', target: 11285, anggaran: 6438350000 }
      ]
    },
    {
      namaProgram: 'Berani Sehat',
      deskripsi: 'Layanan kesehatan gratis dan berkualitas.',
      dinas: 'Dinas Kesehatan',
      usernameKadis: 'kadis_kesehatan',
      subPrograms: [
        { nama: 'Integrasi layanan kesehatan bersama BPJS, berobat Gratis menggunakan KTP', target: 0, anggaran: 0 },
        { nama: 'Pencegahan stunting', target: 0, anggaran: 0 },
        { nama: 'Dukungan terhadap pelaksanaan pemeriksaan kesehatan gratis', target: 0, anggaran: 0 },
        { nama: 'Peningkatan kualitas layanan kesehatan pada Rumah Sakit Umum UNDATA dan MADANI', target: 4, anggaran: 0 },
        { nama: 'Mendorong Rumah Sakit Undata dan Rumah Sakit Madani menjadi rumah sakit rujukan bertaraf internasional', target: 5, anggaran: 0 },
        { nama: 'Jaminan layanan kesehatan bagi masyarakat miskin (Naseha Kami)', target: 100, anggaran: 0 },
        { nama: 'Integrasi layanan kesehatan dengan rumah sakit lainnya di Kota Palu', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Sejahtera',
      deskripsi: 'Stabilitas ekonomi dan pangan.',
      dinas: 'Dinas Sosial',
      usernameKadis: 'kadis_sosial',
      subPrograms: [
        { nama: 'Jaminan harga bahan pokok murah dan stabil', target: 0, anggaran: 0 },
        { nama: 'Menjamin kebutuhan dasar Masyarakat miskin melalui Program Pangan Daerah (PANADA)', target: 0, anggaran: 0 },
        { nama: 'Graduasi masyarakat miskin melalui Program Usaha Ekonomi Produktif (UEP) Graduasi', target: 15550, anggaran: 19757900000 },
        { nama: 'Revitalisasi Rutilahu', target: 17, anggaran: 332271800 },
        { nama: 'Program pelatihan kewirausahaan dan pengembangan UMKM', target: 0, anggaran: 0 },
        { nama: 'Mendukung Makan Bergizi Gratis (MBG)', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Lancar',
      deskripsi: 'Konektivitas infrastruktur jalan dan jembatan.',
      dinas: 'Dinas Bina Marga',
      usernameKadis: 'kadis_binamarga',
      subPrograms: [
        { nama: 'Pembangunan/peningkatan 1.000 kilometer jalan desa', target: 0, anggaran: 0 },
        { nama: 'Peningkatan konektivitas penghubung antara wilayah barat Sulawesi Tengah menuju wilayah timur Sulawesi Tengah dengan mendukung konektivitas Tambu-Kasimba', target: 4, anggaran: 12845446121 },
        { nama: 'Melaksanakan rekonstruksi pemeliharaan dan pembangunan beberapa ruas jalan melalui paket Multi Year Contract (MYC) yang berlokasi di Kabupaten/Kota', target: 26, anggaran: 0 },
        { nama: 'Pembangunan Kawasan Agropolitan kawasan perikanan dan hilirisasi Tongkol Cakalang Tuna (TCT) kawasan sentra hirilisasi rumput laut kawasan afirmasi kawasan konservasi dan rawan bencana dan kawasan pertumbuhan', target: 0, anggaran: 0 },
        { nama: 'Peningkatan konektivitas penghubung antara Kabupaten Banggai Kepulauan dan Kabupaten Banggai Laut', target: 18, anggaran: 668964006 },
        { nama: 'Jaminan ketersediaan air bersih bagi desa-desa yang belum mempunyai akses air bersih', target: 0, anggaran: 7097998590 },
        { nama: 'Jaminan ketersediaan Drainase', target: 29176, anggaran: 28179232000 }
      ]
    },
    {
      namaProgram: 'Berani Menyala',
      deskripsi: 'Akses listrik dan internet merata.',
      dinas: 'Dinas ESDM',
      usernameKadis: 'kadis_esdm',
      subPrograms: [
        { nama: 'Jaminan ketersediaan jaringan internet bagi desa yang masih termasuk dalam wilayah blank spot,', target: 0, anggaran: 0 },
        { nama: 'Jaminan ketersediaan akses listrik bagi masyarakat miskin dan penyediaan lampu jalan bagi daerah yang belum terjangkau penerangan jalan umum', target: 0, anggaran: 0 },
        { nama: 'Peningkatan kualitas layanan Pembangkit Listrik Tenaga Air (PLTA)Sulewana Poso agar dapat menjamin ketersediaan pasokan listrik Sulawesi Tengah', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Makmur',
      deskripsi: 'Kesejahteraan petani dan nelayan.',
      dinas: 'Dinas Pertanian',
      usernameKadis: 'kadis_pertanian',
      subPrograms: [
        { nama: 'Berani Produktivitas melalui peningkatan produktivitas padi sebesar 5-6 Ton/Ha GKG', target: 0, anggaran: 0 },
        { nama: 'Berani Tangkap Banyak melalui pemberian bantuan alat tangkap nelayan', target: 0, anggaran: 0 },
        { nama: 'Program Petani Milenial', target: 0, anggaran: 0 },
        { nama: 'Pemerintah Provinsi sebagai wakil pemerintahpusat di daerah memastikan ketersediaan Benih unggul, Pupuk serta mendorong medernisasi Alsinta', target: 0, anggaran: 0 },
        { nama: 'Mendukung Program resi gudang', target: 0, anggaran: 0 },
        { nama: 'Jaminan sosial bagi petani, nelayan dan pekerja lainnya', target: 0, anggaran: 0 },
        { nama: 'Berani Panen Raya, hasil panen melimpah dengan jaminan harga jual tinggi bagi petani', target: 0, anggaran: 0 },
        { nama: 'Pembangunan sentra pangan berbasis kawasan dan masyarakat', target: 0, anggaran: 0 },
        { nama: 'Berani membangun lingkungan yang berkualitas dan berkelanjutan', target: 0, anggaran: 0 },
        { nama: 'Berani Inseminasi buatan untuk ternak', target: 0, anggaran: 0 },
        { nama: 'Berani KUR melalui pemberian modal usaha dengan bunga 0%', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Berkah',
      deskripsi: 'Kehidupan beragama yang harmonis.',
      dinas: 'Biro Kesra',
      usernameKadis: 'karo_kesra',
      subPrograms: [
        { nama: 'Sulteng Berjamaah', target: 0, anggaran: 0 },
        { nama: 'Sulteng Mengaji', target: 0, anggaran: 0 },
        { nama: 'Insentif bagi guru mengaji, marbot, pendeta/tokoh agama dan pemangku adat', target: 0, anggaran: 0 },
        { nama: 'Penyetaraan status pesantren, madrasah dan sekolah keagamaan', target: 0, anggaran: 0 },
        { nama: 'Perbaikan sarana prasarana keagamaan', target: 443, anggaran: 34208247425 },
        { nama: 'Penguatan peran FKUB dalam kehidupan beragama dan bermasyarakat', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Harmoni',
      deskripsi: 'Pariwisata, budaya, dan ekonomi kreatif.',
      dinas: 'Dinas Pariwisata',
      usernameKadis: 'kadis_pariwisata',
      subPrograms: [
        { nama: 'Berani Wisata', target: 0, anggaran: 0 },
        { nama: 'Berani Ekonomi Kreatif melalui Sulteng Creative Center (SCC)', target: 0, anggaran: 0 },
        { nama: 'Pembentukan Sulteng Creative Center serta penyusunan roadmap SCC', target: 0, anggaran: 0 },
        { nama: 'Berani 20.000 Wirausaha Baru', target: 0, anggaran: 0 },
        { nama: 'Berani Carier center', target: 0, anggaran: 0 },
        { nama: 'Berani Berbudaya menanamkan nilai–nilai kearifan lokal dalam Pemerintahan', target: 0, anggaran: 0 },
        { nama: 'Berani Lestari: Berani menjaga dan melesetarikan nilai-nilai kearifan lokal', target: 0, anggaran: 0 },
        { nama: 'Berani Produktif dan Berekspresi: Berani mengembangkan dan memanfaatkan obyek Pemajuan Kebudayaan dan cagar Budaya Bernilai ekonomi', target: 0, anggaran: 0 },
        { nama: 'Berani BumdesSuksesmemfasilitasi Bumdes berbadan hukum melaksanakan pelatihan, penguatan bumdes, mengikutkan bumdes dalam setiap even', target: 0, anggaran: 0 },
        { nama: 'Berani berinvestasi mempermudah proses investasi dengan layanan cepat, transparan dan berbasis digital', target: 0, anggaran: 0 },
        { nama: 'Berani bermitradalam rangka mendukung UMKM untuk naik kelas serta dukungan pelaksanaan Koperasi Merah Putih', target: 0, anggaran: 0 },
        { nama: 'Pembangunan/peningkatan sarana prasarana olahraga dengan mendukung pembangunan stadion olahraga atau sport center', target: 0, anggaran: 0 }
      ]
    },
    {
      namaProgram: 'Berani Berintegritas',
      deskripsi: 'Reformasi birokrasi dan pelayanan publik.',
      dinas: 'Inspektorat',
      usernameKadis: 'inspektur_daerah',
      subPrograms: [
        { nama: 'Tim Gaspoll(Gerakan Aksi Satset Pemerintah Optimal Layani Langsung) – Call Center, Siaga Laporan CommandCenter', target: 0, anggaran: 0 },
        { nama: 'Implementasi Sistem Administrasi Layanan Publik Terintegrasi (Super Aps Si-Berani) dan peningkatan kualitas penerapan SPBE', target: 0, anggaran: 0 },
        { nama: 'Budaya kerja birokrasi yang Bersih, Akuntabel dan Inovatif (Berani)', target: 0, anggaran: 0 },
        { nama: 'Co-Working Space (CWS) bagi ASN', target: 0, anggaran: 0 },
        { nama: 'Bantuan keuangan bagi pemerintah desa', target: 0, anggaran: 0 }
      ]
    }
  ];

  console.log(`🚀 Menyiapkan ${allProgramsData.length} Program Kerja...`);

  for (const prog of allProgramsData) {
    const programDB = await prisma.programKerja.create({
      data: {
        namaProgram: prog.namaProgram,
        slug: slugify(prog.namaProgram),
        deskripsi: prog.deskripsi
      }
    });

    console.log(`\n📂 [PROGRAM] ${prog.namaProgram} (ID: ${programDB.id})`);

    for (const sub of prog.subPrograms) {
      await prisma.subProgramKerja.create({
        data: {
          programKerjaId: programDB.id,
          namaSubProgram: sub.nama,
          slug: slugify(sub.nama),
          target: sub.target,
          anggaran: BigInt(sub.anggaran)
        }
      });
    }

    await prisma.user.create({
      data: {
        username: prog.usernameKadis,
        password: password,
        role: 'Kepala Dinas',
        dinas: prog.dinas,
        kontak: '08123456789',
        programKerjaId: programDB.id
      }
    });
    console.log(`   👤 Kadis: ${prog.usernameKadis}`);

    for (let i = 1; i <= 5; i++) {
      const dinasSlug = slugify(prog.dinas.replace('Dinas ', '').replace('Biro ', ''));
      const staffUsername = `staff_${dinasSlug}_${i}`;

      await prisma.user.create({
        data: {
          username: staffUsername,
          password: password,
          role: 'Staff',
          dinas: prog.dinas,
          kontak: '08123456789',
          programKerjaId: programDB.id
        }
      });
    }
    console.log(`   👥 Dibuatkan 5 Staff untuk ${prog.dinas}`);
  }

  await prisma.user.create({
    data: {
      username: 'gubernur',
      password: password,
      role: 'Gubernur',
      dinas: 'Kantor Gubernur',
      kontak: '0811111111',
      programKerjaId: null
    }
  });

  console.log('\n==============================================');
  console.log('✅ SEEDING SELESAI!');
  console.log('🔑 Password Default: 123');
  console.log(`📊 Total Program: ${allProgramsData.length}`);
  console.log('👤 Akun Gubernur: gubernur');
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