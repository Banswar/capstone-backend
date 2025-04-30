import express from "express";
import { updatedUser, deleteUser, getUsers, getUser, updateUserDepartment } from "../controllers/user.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.put("/update/:userId", verifyToken, updatedUser)
router.delete("/delete/:userId", verifyToken, deleteUser)
// router.post('/signout', signout)
router.get('/getUsers', verifyToken, getUsers)
router.get('/:userId', getUser);

router.put('/updateUserDepartment/:userId', verifyToken, updateUserDepartment)

export default router;