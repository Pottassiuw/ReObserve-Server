import { Router } from "express";
import {
  criarLancamento,
  deletarLancamento,
  verLancamento,
  verTodosLancamentos,
  atualizarLancamento,
} from "../Controllers/releaseController";
import { authSession, requirePermissions } from "../Middlewares/authMiddleware";
import { Permissoes } from "@prisma/client";

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

router.put(
  "/enterprise/:empresaId/release/:id",
  requirePermissions(Permissoes.editarLancamentos),
  atualizarLancamento,
);

router.patch(
  "/enterprise/:empresaId/release/:id",
  requirePermissions(Permissoes.editarLancamentos),
  atualizarLancamento,
);

router.delete(
  "/enterprise/:empresaId/release/:id",
  requirePermissions(Permissoes.deletarLancamentos),
  deletarLancamento,
);
export default router;
