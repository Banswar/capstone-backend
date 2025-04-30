import DepartmentStats from "../models/departmentsStats.model.js";
import Profile from "../models/user.model.js";

/**
 * Increments the head count of a department by 1.
 * @param {String} departmentId - The ID of the department to update.
 */
export const updateDepartmentHeadCount = async (departmentId) => {
    if (!departmentId) return;

    try {
        await DepartmentStats.updateOne(
        { departmentId },
        { $inc: { head_count: 1 } },
        { upsert: true }
        );
        // console.log(`Department head count incremented for ID: ${departmentId}`);
    } catch (error) {
        console.error("Error updating department head count:", error.message);
    }
};






