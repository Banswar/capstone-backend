import Departments from "../models/departments.model.js"


export const getDepartmentList = async (req, res) => {
    try {
        const departments = await Departments.find();
        if (departments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No departments found'
            });
        }

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
