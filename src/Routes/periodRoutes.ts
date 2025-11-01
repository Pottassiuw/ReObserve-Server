import { Router } from "express";
import {
  listarPeriodos,
  verPeriodo,
  criarPeriodo,
  fecharPeriodo,
  reabrirPeriodo,
  deletarPeriodo,
  buscarLancamentosDisponiveis,
} from "../Controllers/periodController";
import { authSession } from "../Middlewares/authMiddleware";

const router = Router();

router.use(authSession);
router.get("/", listarPeriodos);
router.post("/", criarPeriodo);
router.get("/:id", verPeriodo);

// Buscar lançamentos disponíveis para fechar período
router.get("/:periodoId/available-releases", buscarLancamentosDisponiveis);
router.post("/:id/close", fecharPeriodo);
router.post("/:id/reopen", reabrirPeriodo);
router.delete("/:id", deletarPeriodo);

export default router;
