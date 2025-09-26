import express from "express";
import { registerPhoneUser, registerWebUser, registerWebUsersBulk, loginWebUser, loginPhoneUser, registerHospital, loginHospital } from "../controllers/Auth.controller.js";

const router = express.Router();

// Phone-call registration
router.post("/phone-register", registerPhoneUser);
router.post("/web-register", registerWebUser);
router.post("/web-register/bulk", registerWebUsersBulk);

// User login
router.post("/login/web", loginWebUser);
router.post("/login/phone", loginPhoneUser);

// Hospital register/login
router.post("/hospital/register", registerHospital);
router.post("/hospital/login", loginHospital);

// (Later you can add web/app registration, login, etc.)
export default router;
