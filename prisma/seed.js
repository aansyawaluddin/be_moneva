import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai Seeding Database (1 Sub Program = 1 Kadis & 1 Staff)...');

  await prisma.realisasiBeasiswa.deleteMany();
  await prisma.realisasiBosda.deleteMany();
  await prisma.dataRealisasi.deleteMany();
  await prisma.accessToken.deleteMany();
  await prisma.kategoriSubProgram.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subProgramKerja.deleteMany();
  await prisma.programKerja.deleteMany();

  console.log('🧹 Database lama telah dibersihkan.');

  // 2. SETUP PASSWORD DEFAULT
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('123', salt);

  // 3. BUAT PROGRAM UTAMA
  const programUtama = await prisma.programKerja.create({
    data: {
      namaProgram: 'Berani Cerdas',
      deskripsi: 'Program bantuan pendidikan tuntas dari SD hingga Perguruan Tinggi.'
    }
  });

  // 4. DAFTAR SUB PROGRAM & USERNYA
  // Array ini berisi konfigurasi untuk setiap Sub Program
  const listSubProgram = [
    {
      nama: 'Pemberian Beasiswa Mahasiswa',
      code: 'beasiswa', // Untuk username
      target: 1000,
      kategori: [
        'Mahasiswa Baru Jalur Afirmasi',
        'Mahasiswa Baru Jalur Prestasi-Akademik',
        'Mahasiswa Baru Jalur Prestasi Non-Akademik',
        'Mahasiswa Baru Jalur SNBP',
        'Mahasiswa Baru Jalur SNBT'
      ]
    },
    {
      nama: 'Bantuan Biaya Operasional (BOSDA)',
      code: 'bosda',
      target: 500,
      kategori: ['Penyaluran Dana BOSDA SD/SMP']
    },
    {
      nama: 'Bantuan Seragam dan Sepatu Bagi Siswa Miskin',
      code: 'seragam',
      target: 2000,
      kategori: ['Bantuan Seragam', 'Bantuan Sepatu']
    },
    {
      nama: 'Bantuan PKL/Prakerin Bagi Siswa SMK',
      code: 'pkl',
      target: 300,
      kategori: ['Bantuan Biaya Hidup PKL']
    },
    {
      nama: 'Bantuan Beasiswa Miskin',
      code: 'miskin',
      target: 1500,
      kategori: ['Beasiswa Miskin SD', 'Beasiswa Miskin SMP']
    },
    {
      nama: 'Penerima Beasiswa (S2) Untuk Guru',
      code: 'guru',
      target: 50,
      kategori: ['Beasiswa S2 Dalam Negeri', 'Beasiswa S2 Luar Negeri']
    },
    {
      nama: 'Pengembangan Digitalisasi Pendidikan',
      code: 'digital',
      target: 100,
      kategori: ['Bantuan Laptop/Komputer', 'Pelatihan Digital']
    }
  ];

  // 5. LOOPING PEMBUATAN DATA (SUB PROGRAM + KADIS + STAFF)
  for (const item of listSubProgram) {

    // A. Buat Sub Program & Kategorinya
    const subProgram = await prisma.subProgramKerja.create({
      data: {
        programKerjaId: programUtama.id,
        namaSubProgram: item.nama,
        target: item.target,
        kategori: {
          create: item.kategori.map(kat => ({ namaKategori: kat }))
        }
      }
    });

    console.log(`🔹 Sub Program Dibuat: ${item.nama}`);

    // B. Buat User KEPALA DINAS (Spesifik Sub Program ini)
    await prisma.user.create({
      data: {
        username: `kadis_${item.code}`, // Contoh: kadis_beasiswa
        password: password,
        role: 'Kepala Dinas',
        kontak: '08123456789',
        subProgramId: subProgram.id // <--- KUNCI: Kadis terikat di sini
      }
    });

    // C. Buat User STAFF (Spesifik Sub Program ini)
    await prisma.user.create({
      data: {
        username: `staff_${item.code}`, // Contoh: staff_beasiswa
        password: password,
        role: 'Staff',
        kontak: '08123456789',
        subProgramId: subProgram.id // <--- KUNCI: Staff terikat di sini
      }
    });
  }

  // 6. BUAT USER GUBERNUR (Global / Tidak terikat sub program)
  await prisma.user.create({
    data: {
      username: 'gubernur',
      password: password,
      role: 'Gubernur',
      kontak: '0811111111',
      subProgramId: null // Gubernur bisa akses semua
    }
  });

  console.log('==============================================');
  console.log('✅ SEEDING SELESAI!');
  console.log('🔑 Password Default: 123');
  console.log('----------------------------------------------');
  console.log('👤 AKUN GUBERNUR: gubernur');
  console.log('----------------------------------------------');
  console.log('👤 AKUN PER SUB PROGRAM:');

  listSubProgram.forEach(item => {
    console.log(`   [${item.code.toUpperCase()}]`);
    console.log(`   - Kadis: kadis_${item.code}`);
    console.log(`   - Staff: staff_${item.code}`);
  });
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