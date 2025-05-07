import addressFinder from "../lib/addressFinder.js";
import Activity from "../models/activity.model.js"
import { errorHandler } from "../utils/error.js"
import Profile from "../models/user.model.js"

export const getActivities = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return next(errorHandler(400, 'userId is required'));
        }

        // Fetch user to get role and department
        const user = await Profile.findById(userId);
    
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        let activities;

        if (user.role === 'admin') {
            // Admin can see all activities
            activities = await Activity.find({});
        } else if (user.role === 'department_head') {
            // Department head sees all activities in their department
            if (!user.departmentId) {
                return next(errorHandler(400, 'User does not have a department'));
            }
            activities = await Activity.find({ departmentId: user.departmentId });
        } else if (user.role === 'employee' || user.role === 'guest') {
            // Employee or guest sees their own activities
            activities = await Activity.find({ userId: user._id });
        } else {
            return next(errorHandler(403, 'Unauthorized role'));
        }

        // Match frontend expected response structure
        return res.status(200).json({ 
            success: true, 
            data: activities,
            message: 'Activities fetched successfully'
        });

    } catch (error) {
        next(errorHandler(500, error.message));
    }
};



export const updateActivities = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if(!userId){
            return next(errorHandler(400, 'userId is required'))
        }

        const {
            departmentId,
            departmentName,
            action,
            resource,
            userAgent,
            deviceInfo,
            riskLevel,
            latitude,
            longitude,
            details
        } = req.body;
    
        if (!action || !resource) {
            return next(errorHandler(400, 'Action and resource are required.'));
        }

        const address = latitude && longitude ? await addressFinder(latitude, longitude) : null;

        const newActivity = new Activity({
            userId,
            departmentId,
            departmentName,
            action,
            resource,
            userAgent,
            deviceInfo,
            riskLevel,
            latitude,
            longitude,
            address,
            details
        });
    
        const savedActivity = await newActivity.save();
    
        res.status(200).json({
            success: true,
            message: 'Activity logged successfully',
            data: savedActivity
        });

    } catch (error) {
        next(error); 
    }
};