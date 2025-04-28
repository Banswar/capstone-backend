import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const activitySchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: 'Profiles',
        required: true,
        unique: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    resource: {
        type: String,
        trim: true,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    ipAddress: {
        type: String,
        trim: true,
        default: null
    },
    userAgent: {
        type: String,
        trim: true,
        default: null
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    departmentId: {
        type: Types.ObjectId,
        ref: 'Departments',
        default: null
    },
    details: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });


activitySchema.index({ userId: 1 }, { unique: true });

const Activity = model("Activity", activitySchema);

export default Activity;




    // userId: user._id,
    // action: "Login",
    // resource: "/login",
    // ipAddress: "192.168.1.1",
    // userAgent: "Mozilla/5.0",
    // riskLevel: "low",
    // departmentId: user.departmentId,
    // details: { location: "Nagpur" }