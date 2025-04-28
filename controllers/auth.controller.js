import Profile from '../models/user.model.js';
import bcryptjs from 'bcryptjs'
import { errorHandler } from "../utils/error.js";
import jwt from 'jsonwebtoken';
import roleExpiryTimes from '../config/tokenExpiry.js';

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

        const { password: pass, ...rest } = validUser._doc;

        // res.status(200).cookie('access_token', token, {
        //     httpOnly: true
        // })
        // .json(rest)

        res.status(200).json({
            token,
            user: rest,     
            message: 'Login successful'
        });

    } catch (error) {
        next(error)
    }
}

export const google = async (req, res, next) => {
    const { email, name } = req.body;

    try {
        const user = await Profile.findOne({ email });

        const expiry = roleExpiryTimes[user.role] || '15m'; // fallback to guest time

        if(user){
            const token = jwt.sign({id: user._id, departmentId: validUser.departmentId, expiresIn: expiry}, process.env.JWT_SECRETE);

            const { password, ...rest } = user._doc;

            res.status(200).cookie('access_token', token, {
                httpOnly: true,
            }).json(rest)
        }
        else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const hashedPassWord = bcryptjs.hashSync(generatedPassword, 10);

            const newUser = new Profile({
                username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
                email,
                password: hashedPassWord,

            })
            await newUser.save();
            const expiry = roleExpiryTimes[newUser.role] || '15m'; // fallback to guest time

            const token = jwt.sign( { id: newUser._id, departmentId: validUser.departmentId, expiresIn: expiry }, process.env.JWT_SECRETE )
            const { password, ...rest } = newUser._doc;
            res.status(200).cookie('access_token', token, {
                httpOnly: true,
            }).json(rest);
        }
    } 
    catch (error) {
        next(error)
    }
}

// export const validateSession = async (req, res, next) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         if (!authHeader) {
//             return res.status(401).json({ valid: false, message: 'Authorization header missing' });
//         }

//         const token = authHeader?.split(' ')[1];
//         if (!token) {
//             return res.status(401).json({ valid: false, message: 'Token missing in header' });
//         }

//         // Decode without verification to see what's in the token
//         const decodedContent = jwt.decode(token);
//         console.log('Token payload:', decodedContent);
        
//         // Now verify
//         const decoded = jwt.verify(token, process.env.JWT_SECRETE);
//         console.log('Verified token:', decoded);

//         // Check what user identifier is present in the token
//         // It might be using a different field name than _id
//         if (!decoded._id) {
//             console.log('No _id found in token. Available fields:', Object.keys(decoded));
            
//             // Check for common alternative field names
//             const userId = decoded.id || decoded.userId || decoded.user_id || decoded.sub;
            
//             if (userId) {
//                 // Use the alternative ID field
//                 const user = await Profile.findById(userId).select('-password');
                
//                 if (!user) {
//                     return res.status(404).json({ valid: false, message: 'User not found' });
//                 }
                
//                 // Rest of your code...
                
//             } else {
//                 return res.status(401).json({ valid: false, message: 'User ID missing in token' });
//             }
//         } else {
//             // Original code for when _id is present
//             const user = await Profile.findById(decoded._id).select('-password');
            
//             if (!user) {
//                 return res.status(404).json({ valid: false, message: 'User not found' });
//             }
            
//             if (user.status === 'inactive') {
//                 return res.status(403).json({ valid: false, message: 'User account inactive' });
//             }
            
//             return res.status(200).json({
//                 valid: true,
//                 user: {
//                     id: user._id,
//                     name: user.name,
//                     email: user.email,
//                     role: user.role,
//                     departmentId: user.departmentId,
//                     mfaEnabled: user.mfaEnabled,
//                     failedLoginAttempts: user.failedLoginAttempts,
//                     accountLocked: user.accountLocked,
//                     lockoutUntil: user.lockoutUntil,
//                 }
//             });
//         }

//     } catch (err) {
//         console.error('Error validating session:', err);
        
//         if (err.name === 'TokenExpiredError') {
//             return res.status(401).json({ valid: false, message: 'Token expired' });
//         }
        
//         res.status(500).json({
//             valid: false,
//             message: 'Server error during session validation',
//         });
//     }
// };


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
        
        return res.status(200).json({
            valid: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId || decoded.departmentId,
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