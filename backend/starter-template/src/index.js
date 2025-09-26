// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path: './.env'
})



import { recheckPendingPatients } from './controllers/Patient.controller.js';

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })

    // Start recheck every 30 minutes
    setInterval(recheckPendingPatients, 30 * 60 * 1000);
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})
