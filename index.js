import express from 'express';
import mongoose from 'mongoose';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors'
import authRoutes from './routes/auth.route.js'; 
import userRoutes from './routes/user.route.js'
import departmentRoutes from './routes/department.route.js'
import insertDepartments from './addDepartments.js';
import activityRoutes  from './routes/activity.route.js'


const app = express();
dotenv.config()

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/department", departmentRoutes)
app.use("/api/activity", activityRoutes)
// insertDepartments()

app.use((err, req, res, next) =>{
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    })
})


mongoose.connect(process.env.MONGO)
.then(() =>{
    console.log("MongoDb is connected")
})
.catch((err) =>{
    console.log(err) 
})

app.get('/', (req, res) => {
    res.send('Server is running....')
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
