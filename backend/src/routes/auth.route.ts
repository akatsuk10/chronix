import { Router } from "express";
import { getNonce, verifyWalletSignature } from "../controllers/auth.controller";

const router = Router();

router.get("/nonce", getNonce);
router.post("/verify", verifyWalletSignature);

export default router;
