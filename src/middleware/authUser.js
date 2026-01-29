import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ msg: "Akses Ditolak: Token tidak ditemukan" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ msg: "Token Invalid atau Kadaluarsa" });
    
    req.user = decoded; 
    next();
  });
};

export const verifyGovernor = (req, res, next) => {
    if (req.user.role !== 'Gubernur') {
        return res.status(403).json({ 
            msg: "Akses Terlarang: Fitur ini khusus untuk Gubernur." 
        });
    }
    next();
};

export const verifyProgramAccess = (req, res, next) => {
    const allowedRoles = ['Gubernur', 'Kepala Dinas'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: "Akses Terlarang" });
    }
    next();
};