import express from 'express'
import { getActivities, updateActivities } from '../controllers/activity.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/getActivities/:userId', verifyToken, getActivities)
router.post('/updateActivities/:userId', verifyToken, updateActivities)


export default router;