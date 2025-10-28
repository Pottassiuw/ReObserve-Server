import { Router } from "express";
import {
  colocarUsuarioGrupo,
  CriarGrupo,
  deletarGrupoEmpresa,
  deletarTodosGruposEmpresa,
  verGruposEmpresa,
  removerUsuarioGrupo,
} from "../Controllers/groupController";
import { authSession } from "../Middlewares/authMiddleware";

const router = Router();
router.use(authSession);

router.post("/enterprises/groups", CriarGrupo);
router.get("/enterprises/groups", verGruposEmpresa);
router.post("/enterprises/groups/:groupId/users/:userId", colocarUsuarioGrupo);
router.delete("/enterprises/groups/:groupId", deletarGrupoEmpresa);
router.delete(
  "/enterprises/groups",

  deletarTodosGruposEmpresa,
);
router.delete(
  "/enterprises/users/:userId/groups/:groupId",
  removerUsuarioGrupo,
);
export default router;
