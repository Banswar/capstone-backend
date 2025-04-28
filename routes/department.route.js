import express from 'express'
import { verifyToken } from '../utils/verifyUser.js';
import { getDepartmentList } from '../controllers/department.controller.js';

const router = express.Router()

router.get('/getDepartmentList', verifyToken, getDepartmentList)

export default router;

