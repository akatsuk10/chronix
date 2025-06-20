import { Router } from "express";
import { login, verifyWalletSignature } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/verify", verifyWalletSignature);

export default router;
