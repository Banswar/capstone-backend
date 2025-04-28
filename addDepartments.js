import Departments from "./models/departments.model.js";

const departmentsData = [
    { _id: "dept001", name: "Engineering" },
    { _id: "dept002", name: "Marketing" },
    { _id: "dept003", name: "Sales" },
    { _id: "dept004", name: "Finance" },
    { _id: "dept005", name: "Human Resources" },
    { _id: "dept006", name: "Product" },
    { _id: "dept007", name: "Design" },
    { _id: "dept008", name: "Customer Support" },
    { _id: "dept009", name: "Operations" },
    { _id: "dept010", name: "Legal" },
    { _id: "dept011", name: "Executive" },
    { _id: "dept012", name: "Other" }
];

const insertDepartments = async () => {
    try {
        await Departments.insertMany(departmentsData);
        console.log("Departments inserted successfully");
    } catch (error) {
        console.error("Error inserting departments:", error);
    }
};

export default insertDepartments;