// periodRoutes.ts
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

// Todas as rotas precisam de autenticação
router.use(authSession);

// Listar períodos
router.get("/", listarPeriodos);

// Criar período
router.post("/", criarPeriodo);

// Ver período específico
router.get("/:id", verPeriodo);

// Buscar lançamentos disponíveis para fechar período
router.get("/:periodoId/available-releases", buscarLancamentosDisponiveis);

// Fechar período
router.post("/:id/close", fecharPeriodo);

// Reabrir período
router.post("/:id/reopen", reabrirPeriodo);

// Deletar período
router.delete("/:id", deletarPeriodo);

export default router;
