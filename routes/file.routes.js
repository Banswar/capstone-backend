import express from 'express';
import multer from 'multer';
import { uploadFile, getAllFiles } from '../controllers/file.controller.js';
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();
const upload = multer();


router.post('/upload', upload.single('file'), uploadFile);
router.get('/getAllFiles', getAllFiles);

export default router;
