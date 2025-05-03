import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// Method to check if OTP is expired
otpSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};

// TTL index: Automatically deletes document 5 minutes after expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
