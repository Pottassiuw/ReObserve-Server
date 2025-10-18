import { Router } from "express";
import { authSession } from "../Middlewares/authMiddleware";
import { criarPeriodo, removerPeriodo } from "../Controllers/periodController";

const router = Router();
router.use(authSession);

router.post("/", criarPeriodo);
router.delete("/:periodoId", removerPeriodo);

export default router;
