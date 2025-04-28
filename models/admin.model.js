import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const adminSchema = new Schema({
    adminId: {
        type: Types.ObjectId,
        ref: "Profiles",
        required: true,
        unique: true 
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    }
}, { timestamps: true });

const Admin = model("Admin", adminSchema);

export default Admin;
