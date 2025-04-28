import mongoose from "mongoose";
import DepartmentStats from "./departmentsStats.model.js";
import DepartmentHead from "./departmentsHead.model.js";
import Departments from "./departments.model.js";
import Admin from "./admin.model.js";

const profile  = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password:{
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ['admin', 'department_head', 'employee', 'guest'],
        default: 'guest'
    },

    departmentId: { 
        type: String, 
        ref: "Departments",
        default: null 
    },

    mfaEnabled: {
        type: Boolean,
        default: true
    },

    failedLoginAttempts: {
        type: Number,
        default: 0
    },

    accountLocked: {
        type: Boolean,
        default: false
    },
    
    lockoutUntil: {
        type: Date,
        default: null
    }
}, {timestamps: true} )


profile.post('save', async function (doc) {
    try {
        const departmentId = doc.departmentId;
        await DepartmentStats.updateOne(
            { departmentId },
            { $inc: { head_count: 1 } },
            { upsert: true }
        );
        console.log(`Head count updated for department: ${departmentId}`);
    } catch (error) {
        console.error("Error updating head count:", error);
    }
});


profile.post('save', async function (doc) {
    try {
        if (doc.role === 'department_head') {
            // Check if the user has a departmentId
            if (doc.departmentId) {
                // Fetch department name from Departments collection
                const department = await Departments.findOne({ _id: doc.departmentId });
                if (department) {
                    // Create a new DepartmentHead document with department name
                    await DepartmentHead.create({
                        userId: doc._id,
                        username: doc.username,
                        departmentId: doc.departmentId,
                        departmentName: department.name
                    });

                    console.log(`User ${doc.username} added as Department Head for department: ${department.name}`);
                } else {
                    console.error("Department not found for ID:", doc.departmentId);
                }
            }
        }
    } catch (error) {
        console.error("Error adding to DepartmentHead collection:", error);
    }
});


profile.post('save', async function (doc) {
    try {
        if (doc.role === 'admin') {
            const exists = await Admin.findOne({ adminId: doc._id });
            if (!exists) {
                await Admin.create({
                    adminId: doc._id,
                    username: doc.username,
                    email: doc.email
                });
                console.log(`Admin ${doc.username} added to Admins collection`);
            }
        }
    } catch (error) {
        console.error("Error adding admin to Admins collection:", error);
    }
});




const Profile = mongoose.model("Profiles", profile);
export default Profile