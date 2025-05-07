import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const activitySchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: 'Profiles',
        required: true
    },
    departmentId: {
        type: String,
        default: null
    },
    departmentName: {
        type: String,
        default: null
    },
    action: {
        type: String,
        required: true,
    },
    resource: {
        type: String,
        default: null,
        required: true
    },
    userAgent: {
        type: String,
        default: null
    },
    deviceInfo: {
        type: String,
        trim: true,
        default: null
    },
    riskLevel: {
        type: String,
        default: 'low'
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    details: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });


const Activity = model("Activity", activitySchema);

export default Activity;
