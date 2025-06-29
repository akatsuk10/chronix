import { Router } from "express";
import { login, verifyWalletSignature, refresh} from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/verify", verifyWalletSignature);
router.post("/refresh", refresh)


export default router;
