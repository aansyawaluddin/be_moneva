import prisma from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authController = {
  // Register
  register: async (req, res) => {
    try {
      const { username, password, role, kontak, subProgramId } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) return res.status(400).json({ msg: "Username sudah digunakan" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (role === 'Staff' && !subProgramId) {
        return res.status(400).json({ msg: "Role Staff wajib memilih Sub Program Kerja" });
      }

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role,
          kontak: kontak, 
          subProgramId: subProgramId ? Number(subProgramId) : null
        },
        include: {
          subProgram: true 
        }
      });

      res.status(201).json({
        msg: "Registrasi Berhasil",
        userId: user.id,
        role: user.role,
        kontak: user.kontak,
        subProgram: user.subProgram ? user.subProgram.namaSubProgram : null
      });

    } catch (error) {
      console.error("ERROR REGISTRASI:", error);
      res.status(500).json({ msg: "Terjadi kesalahan saat registrasi", error: error.message });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Password salah" });

      const accessToken = jwt.sign(
        { id: user.id, role: user.role, subProgramId: user.subProgramId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1d' }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      await prisma.accessToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: expiresAt
        }
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        accessToken,
        id: user.id,
        username: user.username,
        role: user.role,
        kontak: user.kontak,
        subProgramId: user.subProgramId 
      });

    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ msg: error.message });
      }
    }
  },

  // Logout
  logout: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);

    const tokenRecord = await prisma.accessToken.findUnique({
      where: { token: refreshToken }
    });

    if (!tokenRecord) return res.sendStatus(204);

    await prisma.accessToken.delete({
      where: { token: refreshToken }
    });

    res.clearCookie('refreshToken');
    return res.sendStatus(200);
  },

  // Get User Profile 
    getUserDetail: async (req, res) => {
        try {
            const userId = req.user.id; 

            const user = await prisma.user.findUnique({
                where: { id: Number(userId) },
                include: {
                    subProgram: {
                        include: {
                            programKerja: true 
                        }
                    },

                    inputanRealisasi: {
                        orderBy: { tanggalInput: 'desc' }, 
                        include: {
                            kategori: true, 
                            detailBeasiswa: true,
                        }
                    },

                    verifikasiRealisasi: {
                        orderBy: { tanggalVerifikasi: 'desc' },
                        include: {
                            kategori: true,
                            detailBeasiswa: true,
                            inputer: { 
                                select: { username: true, kontak: true }
                            }
                        }
                    }
                }
            });

            if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
            const { password, ...userData } = user;

            res.json({
                status: "success",
                data: userData
            });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },
  
};

export default authController;