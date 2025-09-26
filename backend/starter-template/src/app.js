import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import hospitalRoutes from "./routes/Hospital.route.js"

import userRoutes from "./routes/Auth.route.js";
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes declaration
import hospitalRoutes from './routes/Hospital.route.js';
import patientRoutes from './routes/Patient.route.js';

app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use("/api/users", userRoutes);


// Health check route
app.get("/", (req, res) => {
  res.send("Community Blood & Organ Donation API is running ✅");
});

// http://localhost:8000/api/v1/users/register

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

export { app }
