import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/authUser.js';

const router = express.Router();

// Route Register
router.post('/register', authController.register);

// Route Login
router.post('/login', authController.login);

// Route Logout
router.delete('/logout', authController.logout);

// Route Get
router.get('/profile', verifyToken, authController.getUserDetail);

export default router;