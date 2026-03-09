import { Router } from "express";
import {
  retornarUsuarios,
  retornarUsuarioId,
} from "../Controllers/userController";
import {
  retornarEmpresas,
  retornarEmpresasId,
  deletarEmpresa,
  deletarTodasEmpresas,
  deletarTodosUsuariosEmpresa,
  deletarUsuario,
} from "../Controllers/enterpriseController";
import { authSession, requireSuperAdmin } from "../Middlewares/authMiddleware";
import {
  CriarGrupo,
  verGruposEmpresa,
  colocarUsuarioGrupo,
  deletarGrupoEmpresa,
  deletarTodosGruposEmpresa,
} from "../Controllers/groupController";
import { criarUsuario } from "../Controllers/auth/User";
import { criarEmpresa } from "../Controllers/auth/Enterprise";
import { verTodosLancamentos } from "../Controllers/releaseController";

const router = Router();

router.use(authSession, requireSuperAdmin);

// Empresas
router.post("/empresas", criarEmpresa);
router.get("/empresas", retornarEmpresas);
router.get("/empresas/:id", retornarEmpresasId);
router.delete("/empresas/:id", deletarEmpresa);
router.delete("/empresas/", deletarTodasEmpresas);

// Usuários
router.post("/usuarios", criarUsuario);
router.get("/usuarios", retornarUsuarios);
router.get("/usuarios/:id", retornarUsuarioId);
router.delete("/usuarios/:id", deletarUsuario);
router.delete("/empresas/:empresaId/usuarios", deletarTodosUsuariosEmpresa);

// Grupos
router.post("/empresas/:empresaId/grupos", CriarGrupo);
router.get("/empresas/:empresaId/grupos", verGruposEmpresa);
router.post(
  "/empresas/:empresaId/grupos/:grupoId/usuarios/:usuarioId",
  colocarUsuarioGrupo
);
router.delete("/empresas/:empresaId/grupos/:grupoId", deletarGrupoEmpresa);
router.delete("/empresas/:empresaId/grupos", deletarTodosGruposEmpresa);

// Lançamentos
router.get("/lancamentos", verTodosLancamentos);

export default router;
