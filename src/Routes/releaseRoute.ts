import { Router } from "express";
import {
  criarLancamento,
  deletarLancamento,
  verLancamento,
  verTodosLancamentos,
} from "../Controllers/releaseController";
import { authSession, requirePermissions } from "../Middlewares/authMiddleware";
import { Permissoes } from "../generated/prisma";

const router = Router();
router.use(authSession);
router.post(
  "/enterprise/",
  requirePermissions(Permissoes.lancamento),
  criarLancamento,
);

router.get(
  "/enterprise/:empresaId/releases/:id",
  requirePermissions(Permissoes.verLancamentos),
  verLancamento,
);

router.get(
  "/enterprise/:empresaId/releases",
  requirePermissions(Permissoes.verLancamentos),
  verTodosLancamentos,
);

router.delete(
  "/enterprise/:empresaId/release/:id",
  requirePermissions(Permissoes.deletarLancamentos),
  deletarLancamento,
);
export default router;
