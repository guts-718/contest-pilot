import { Router } from "express";
import { analyzeHandler } from "./controller";

const router = Router();

router.post("/analyze", analyzeHandler);

export default router;