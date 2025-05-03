import express from 'express'
import { signup, signin, google, signout, validateSession, requestOTP, verify_otp, resend_otp } from '../controllers/auth.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout', signout)
router.get('/validate-session', validateSession)

router.post('/request-otp', verifyToken, requestOTP)
router.post('/verify-otp', verifyToken, verify_otp)
router.post('/resend-otp', verifyToken, resend_otp)

export default router;