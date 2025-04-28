import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const DepartmentHeadSchema = new Schema({
    userId: {
        type: Types.ObjectId, 
        required: true,
        ref: "Profiles"
    },

    username: {
        type: String,
        required: true,
        ref: "Profiles"
    },

    departmentId: {
        type: String,  
        required: true,
        ref: "Departments"
    },

    departmentName: {
        type: String, 
        required: true
    }
}, { timestamps: true });


DepartmentHeadSchema.index({ userId: 1, departmentId: 1 }, { unique: true });

const DepartmentHead = model("DepartmentHead", DepartmentHeadSchema);

export default DepartmentHead;
