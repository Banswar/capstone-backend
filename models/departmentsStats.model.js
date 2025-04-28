import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DepartmentStatsSchema = new Schema({
    departmentId: { 
        type: String, 
        required: true, 
        ref: "Departments"
    },

    name: { 
        type: String, 
        required: true     
    },

    head_count: { 
        type: Number, 
        default: 0        
    },
}, { timestamps: true });

const DepartmentStats = model("DepartmentStats", DepartmentStatsSchema);

export default DepartmentStats;
