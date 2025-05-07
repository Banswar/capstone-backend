import Profile from '../models/user.model.js';
import bcryptjs from 'bcryptjs'
import { errorHandler } from "../utils/error.js";
import jwt from 'jsonwebtoken';
import Departments from '../models/departments.model.js';
import { calculateExpiryTimestamp, getExpiryTimeByRole } from '../config/tokenExpiry.js';
import sendOtpEmail from '../lib/nodemailer.js';
import OTP from '../models/otp.model.js'

const otpStore = {}


export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password || username === '' || email === '' || password === ''){
        next(errorHandler(400, 'All fields are required'));
    }
    
    const hashedPassWord = bcryptjs.hashSync(password, 10);
    
    const isUser = await Profile.findOne({email: email});

    if(isUser){
        return res.json({
            error: false,
            message: "User already exist",
        })
    }

    const user = new Profile({
        username,
        email,
        password: hashedPassWord,
    })

    await user.save();

    const expiresIn = getExpiryTimeByRole(user.role);
    
    console.log('Sign Up Role:', user.role);
    console.log('Sign Up Calculated Expiry Time:', expiresIn);

    const accessToken = jwt.sign({user}, process.env.JWT_SECRETE, {
        expiresIn: expiresIn,
    })

    const expiryTimestamp = calculateExpiryTimestamp(expiresIn);
    console.log('Sign up exact timestamp: ', expiryTimestamp)
    

    return res.json({
        success: true,
        user: user,
        accessToken,
        message: "Registration Successful",
        expiryTimestamp
    })
}


export const signin = async (req, res, next) => {
    const { email, password } = req.body;
        
    if (!email || !password || email === '' || password === '') {
            return next(errorHandler(400, 'All fields are required'));
    }
        
    try {
        const validUser = await Profile.findOne({ email });
        if (!validUser) {
            return next(errorHandler(404, 'User not found'));
        }
        
        const expiresIn = getExpiryTimeByRole(validUser.role);
        
        console.log('Sign in Role:', validUser.role);
        console.log('Sign in Calculated Expiry Time:', expiresIn);
        

        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) {
            return next(errorHandler(400, 'Invalid password'));
        }
        
            
        const expiryTimestamp = calculateExpiryTimestamp(expiresIn);
        console.log('Sign in exact timestamp: ', expiryTimestamp)
        

        const token = jwt.sign(
            { 
                id: validUser._id, 
                departmentId: validUser.departmentId 
            },
                process.env.JWT_SECRETE,
                { expiresIn }
        );
        
            
        const { password: pass, ...rest } = validUser._doc;
        
            // Get department details
        let departmentName = null;
        if (validUser.departmentId) {
            const department = await Departments.findById(validUser.departmentId);
            if (department) {
                departmentName = department.name;
            }
        }
        
            
        const userData = {
            ...rest,
            departmentName,
            expiryTimestamp  
        };
        
        
        res.status(200).json({
            success: true,
            user: userData,
            token,
            message: 'Login successful'
        });
    } catch (error) {
        next(error);
    }
};

export const google = async (req, res, next) => {
    const { email, username } = req.body;

    if(!email || !username) {
        return next(errorHandler(400, 'Email and name are required'));
    }

    try {
        const durationMap = {
            guest: 15,
            employee: 30,
            department_head: 45,
            admin: 60
        };

        const user = await Profile.findOne({ email });

        const minutes = durationMap[user.role] || 15;
        const sessionExpiry = new Date(Date.now() + minutes * 60 * 1000);

        if(user){
            await Profile.findByIdAndUpdate(user._id, { sessionExpiresAt: sessionExpiry });
        
            console.log('google login Role:', user.role);
            console.log('google login Calculated Expiry Time:', sessionExpiry);
            
            const token = jwt.sign({ id: user._id, expiresIn: sessionExpiry }, process.env.JWT_SECRETE);
            console.log('Sign in exact timestamp: ', sessionExpiry)

            const { password, ...rest } = user._doc;

            const department = await Departments.findById(user.departmentId);
            rest.departmentName = department?.name || "other";

            const userData = {
                ...rest,
            }

            res.status(200).json({
                error: false,
                user: userData,
                token,
                message: 'Login successful with google'
            });
        }
        else{
            // User doesn't exist, create new one
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

            const newUser = new Profile({
                username: username.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword
            });
            
            await newUser.save();

            const minutes = durationMap[newUser.role] || 15;
            const sessionExpiry = new Date(Date.now() + minutes * 60 * 1000);

            await Profile.findByIdAndUpdate(newUser._id, { sessionExpiresAt: sessionExpiry });
            
            // const expiresIn = getExpiryTimeByRole(newUser.role);
        
            console.log('google login Role:', newUser.role);
            console.log('google login Calculated Expiry Time:', newUser.sessionExpiresAt);
            
            const token = jwt.sign({ id: newUser._id, expiresIn: sessionExpiry }, process.env.JWT_SECRETE);

            // console.log('Sign in exact timestamp: ', newUser.sessionExpiresAt)

            const { password, ...rest } = newUser._doc;

            const userData = {
                ...rest,
            }
            
            res.status(200).json({
                error: false,
                user: userData,
                token,
                message: 'Login successful with google'
            });
        }
    } 
    catch (error) {
        console.error("Google auth error:", error);
        next(error);
    }
};

export const signout = (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: "User has been signed out successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const validateSession = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ valid: false, message: 'Authorization header missing' });
        }

        const token = authHeader?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ valid: false, message: 'Token missing in header' });
        }
        
        // Verify the token and handle expiration error
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRETE);

            // Use the id field directly instead of looking for _id
            const userId = decoded.id;

            if (!userId) {
                return res.status(401).json({ valid: false, message: 'User ID missing in token' });
            }

            // Look up the user with the correct ID
            const user = await Profile.findById(userId).select('-password');

            if (!user) {
                return res.status(404).json({ valid: false, message: 'User not found' });
            }

            if (user.status === 'inactive') {
                return res.status(403).json({ valid: false, message: 'User account inactive' });
            }

            const department = await Departments.findById(user.departmentId);
            user.departmentName = department?.name || null;

            const durationMap = {
                guest: 15,
                employee: 30,
                department_head: 45,
                admin: 60
            };
            

            console.log('validate session in Role:', user.role);
            console.log('validate session is Calculated Expiry Time:', user.sessionExpiresAt);


            return res.status(200).json({
                valid: true,
                user: {
                    id: user._id,
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    departmentId: user.departmentId || decoded.departmentId,
                    departmentName: user.departmentName,
                    mfaEnabled: user.mfaEnabled,
                    failedLoginAttempts: user.failedLoginAttempts,
                    accountLocked: user.accountLocked,
                    lockoutUntil: user.lockoutUntil,
                    expiryTimestamp: user.sessionExpiresAt,
                }
            });

        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                // Handle token expiry error separately
                console.log(err);
                return res.status(401).json({
                    valid: false,
                    message: 'Token expired',
                    expiresAt: err.expiredAt  // Use the actual expiration time from the error object
                });
            } else {
                // Handle any other JWT verification errors
                console.error('JWT verification error:', err);
                return res.status(401).json({
                    valid: false,
                    message: 'Invalid token'
                });
            }
        }

    } catch (err) {
        console.error('Error validating session:', err);
        res.status(500).json({
            valid: false,
            message: 'Server error during session validation'
        });
    }
};


export const requestOTP = async (req, res, next) => {
    try {
        const { toEmail, otp } = req.body;

        if (!otp || !toEmail) {
            return next(errorHandler(400, 'All fields are required'));
        }

        if (otp.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be at least 6 digits',
            });
        }

        const user = await Profile.findOne({ email: toEmail });
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + process.env.OTP_EXPIRY_MINUTES);
        
        await OTP.deleteMany({ email: toEmail });

        const newOtp = new OTP({
            email: toEmail,
            otp,
            expiresAt
        });

        await newOtp.save();

        const response = await sendOtpEmail(user.email, otp, user.username);

        if (!response) {
            await OTP.deleteOne({ email: user.email, otp });
            return next(errorHandler(500, 'Failed to send OTP email'));
        }else{

            return res.status(200).json({
                success: true,
                message: `OTP sent to ${user.email}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
            });
        }
    } catch (error) {
        next(errorHandler(500, error.message || 'Internal Server Error'));
    }
};


export const verify_otp = async(req, res) => {

    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and OTP are required' 
        });
    }
    
    try {
        const otpRecord = await OTP.findOne({ email });
        
        // Check if OTP exists for the email
        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP requested for this email' 
            });
        }
        
        // Check if OTP is expired
        if (otpRecord.isExpired()) {
          // Remove expired OTP - though the TTL index will do this automatically as well
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }
        
        // Verify OTP
        if (otpRecord.otp === otp) {
          // OTP verified successfully, remove it to prevent reuse
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.json({ 
                success: true, 
                message: 'OTP verified successfully' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


export const resend_otp = async(req, res, next) => {
    const { toEmail, otp } = req.body;

    if (!toEmail || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }

    if (otp.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'OTP must be at least 6 digits',
        });
    }


    try {
        const user = await Profile.findOne({ email: toEmail });
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + process.env.OTP_EXPIRY_MINUTES);
        
        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email: toEmail });

        const newOtp = new OTP({
            email: toEmail,
            otp,
            expiresAt
        });
        
          // Save to database
        await newOtp.save();


        const response = await sendOtpEmail(user.email, otp, user.username);

        if (!response) {
            await OTP.deleteOne({ _id: newOtp._id });
            return next(errorHandler(500, 'Failed to send OTP email'));
        }else{
            return res.status(200).json({
                success: true,
                message: `OTP sent to ${user.email}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
            });
        }
    } catch (error) {
        console.error('Error in OTP generation:', error);
        return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
        });
    }
}