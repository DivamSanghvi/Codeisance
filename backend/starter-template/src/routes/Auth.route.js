import express from "express";
import { registerPhoneUser, registerWebUser } from "../controllers/Auth.controller.js";

const router = express.Router();

// Phone-call registration
router.post("/phone-register", registerPhoneUser);
router.post("/web-register", registerWebUser);

// (Later you can add web/app registration, login, etc.)
export default router;
