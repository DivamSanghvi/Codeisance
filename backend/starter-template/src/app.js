import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
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
app.use("/api/users", userRoutes);


// Health check route
app.get("/", (req, res) => {
  res.send("Community Blood & Organ Donation API is running ✅");
});

// http://localhost:8000/api/v1/users/register

export { app }