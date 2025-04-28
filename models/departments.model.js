import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
    _id: String,
    name: {
        type: String,
    },
}, {timestamps: true} );

const Departments = mongoose.model("Departments", DepartmentSchema)
export default Departments;