import Profile from '../models/user.model.js';
import bcryptjs from 'bcryptjs'
import { errorHandler } from "../utils/error.js";
import jwt from 'jsonwebtoken';
import roleExpiryTimes from '../config/tokenExpiry.js';
import Departments from '../models/departments.model.js';

export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password || username === '' || email === '' || password === ''){
        next(errorHandler(400, 'All fields are required'));
    }
    
    const hashedPassWord = bcryptjs.hashSync(password, 10);
    
    const isUser = await Profile.findOne({email: email});

    if(isUser){
        return res.json({
            error: true,
            message: "User already exist",
        })
    }

    const user = new Profile({
        username,
        email,
        password: hashedPassWord,
    })

    await user.save();

    const expiry = roleExpiryTimes[user.role] || '15m'; // fallback to guest time


    const accessToken = jwt.sign({user}, process.env.JWT_SECRETE, {
        expiresIn: expiry,
    })

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration Successful",
    })
}

export const signin = async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password || email === '' || password === ''){
        next(errorHandler(400, 'All fields are required'))
    }

    try {
        const validUser = await Profile.findOne({ email });
        if(!validUser){
            return next(errorHandler(404, 'User not found'));
        }

        const expiry = roleExpiryTimes[validUser.role] || '15m'; // fallback to guest time

        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if(!validPassword){
            return next(errorHandler(400, 'Invalid password'));
        }

        const token = jwt.sign(
            { id: validUser._id, departmentId: validUser.departmentId }, 
            process.env.JWT_SECRETE, { expiresIn: expiry }
        )

        // console.log(validUser.username)

        const { password: pass, ...rest } = validUser._doc;

        const department = await Departments.findById(validUser.departmentId);
        rest.departmentName = department?.name || "other";

        res.status(200).json({
            token,
            user: rest,     
            message: 'Login successful'
        });

    } catch (error) {
        next(error)
    }
}

// export const google = async (req, res, next) => {
//     const { email, name } = req.body;

//     try {
//         const user = await Profile.findOne({ email });

//         const expiry = roleExpiryTimes[user.role] || '15m'; // fallback to guest time

//         if(user){
//             const token = jwt.sign({ expiresIn: expiry }, process.env.JWT_SECRETE);

//             const { password, ...rest } = user._doc;

//             res.status(200).json({
//                 error: false,
//                 token,
//                 user: rest,
//                 message: 'Login successful with google'
//             })
//         }
//         else{
//             const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

//             const hashedPassWord = bcryptjs.hashSync(generatedPassword, 10);

//             const newUser = new Profile({
//                 username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
//                 email,
//                 password: hashedPassWord,

//             })
            
//             await newUser.save();
//             const expiry = roleExpiryTimes[newUser.role] || '15m'; // fallback to guest time

//             const token = jwt.sign({ expiresIn: expiry }, process.env.JWT_SECRETE)

//             const { password, ...rest } = newUser._doc;
            
//             res.status(200).json({
//                 error: false,
//                 token,
//                 user: rest,
//                 message: 'Login successful with google'
//             })
//         }
//     } 
//     catch (error) {
//         next(error)
//     }
// }

export const google = async (req, res, next) => {
    const { email, username } = req.body;

    if(!email || !username) {
        return next(errorHandler(400, 'Email and name are required'));
    }

    try {
        const user = await Profile.findOne({ email });

        if(user){
            const expiry = roleExpiryTimes[user.role] || '15m'; 
            
            const token = jwt.sign({ id: user._id, expiresIn: expiry }, process.env.JWT_SECRETE);

            const { password, ...rest } = user._doc;

            const department = await Departments.findById(user.departmentId);
            rest.departmentName = department?.name || "other";

            res.status(200).json({
                error: false,
                token,
                user: rest,
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
            
            const expiry = '15m';
            
            const token = jwt.sign({ id: newUser._id, expiresIn: expiry }, process.env.JWT_SECRETE);

            const { password, ...rest } = newUser._doc;
            
            res.status(200).json({
                error: false,
                token,
                user: rest,
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
        
        // Verify the token
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
        user.departmentName = department?.name || "other";

        // console.log(user.username)
        
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
            }
        });

    } catch (err) {
        console.error('Error validating session:', err);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ valid: false, message: 'Token expired' });
        }
        
        res.status(500).json({
            valid: false,
            message: 'Server error during session validation',
        });
    }
};