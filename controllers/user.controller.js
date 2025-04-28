import User from "../models/user.model.js"
import { errorHandler } from "../utils/error.js"
import bcryptjs from 'bcryptjs'


export const updatedUser = async (req, res, next) => {
    // Check if the user has permission to update the profile
    if (req.user.id !== req.params.userId) {
        return next(errorHandler(403, "You are not allowed to update this user"));
    }

    try {
        // Handle password validation and hashing
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return next(errorHandler(400, "Password must be at least 6 characters"));
            }
            req.body.password = bcryptjs.hashSync(req.body.password, 10);
        }

        // Handle username validation
        if (req.body.username) {
            if (req.body.username.length < 5 || req.body.username.length > 20) {
                return next(errorHandler(400, 'Username must be between 7 to 20 characters'));
            }
            if (req.body.username.includes(' ')) {
                return next(errorHandler(400, 'Username cannot contain spaces'));
            }
            if (!req.body.username.match(/^[a-zA-Z0-9]+$/)) {
                return next(errorHandler(400, 'Username can only contain letters and numbers'));
            }
        }

        // Handle photo upload to Supabase
        // let profilePictureUrl = req.body.profilePicture;
        // if (req.file) { // Assuming you use `multer` for handling file uploads
        //     const { buffer, originalname } = req.file;
        //     const fileName = `${Date.now()}_${originalname}`;
        //     const { data, error } = await supabase.storage
        //         .from('profile-pictures') // Your Supabase storage bucket
        //         .upload(fileName, buffer, {
        //             contentType: req.file.mimetype,
        //         });

        //     if (error) {
        //         return next(errorHandler(500, 'Failed to upload profile picture'));
        //     }

        //     // Get the public URL of the uploaded file
        //     const { publicURL } = supabase.storage
        //         .from('profile-pictures')
        //         .getPublicUrl(fileName);

        //     profilePictureUrl = publicURL;
        // }

        // Update user in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            {
                $set: {
                    username: req.body.username,
                    email: req.body.email,
                    password: req.body.password,
                },
            },
            { new: true }
        );

        // Return the updated user data excluding the password
        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {

    if(!req.user.isAdmin && req.user.id !== req.params.userId){
        return next(errorHandler(403, "You are not allowed to delete this user"))
    }

    try {
        await User.findByIdAndDelete(req.params.userId);
        res.status(200).json({message: "User Deleted successfully"})
    } 
    catch (error) {
        next(error);
    }
}

export const signout = (req, res, next) => {
    try{
        res.clearCookie('access_token').status(200).json("User has been signed out successfully")
    }
    catch(error){
        next(error)
    }
}


export const getUsers = async (req, res, next) => {

    if(!req.user.isAdmin){
        return next(errorHandler(403, 'You are not allowed to see all users'))
    }

    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const users = await User.find()
        .sort({createdAt: sortDirection})
        .skip(startIndex)
        .limit(limit);

        const usersWithoutPassword = users.map((user) => {
            const { password, ...rest } = user._doc;
            return rest;
        })

        const totalUsers = await User.countDocuments()

        const now = new Date()

        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        )

        const lastMonthUsers = await User.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        })

        res.status(200).json({
            users: usersWithoutPassword,
            totalUsers,
            lastMonthUsers,
        })

    } catch (error) {
        next(error)
    }
}


export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);

        if(!user){
            return next(errorHandler(404, 'User not found'))
        }

        const { password, ...rest } = user._doc;
        res.status(200).json(rest)
    } catch (error) {
        next(error)
    }
}
