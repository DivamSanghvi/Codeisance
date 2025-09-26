import express from "express";
import { registerPhoneUser } from "../controllers/Auth.controller.js";

const router = express.Router();

// Phone-call registration
router.post("/phone-register", registerPhoneUser);

// (Later you can add web/app registration, login, etc.)
export default router;
