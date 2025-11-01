import { Router } from "express";
import { criarEmpresa } from "../Controllers/auth/Enterprise";
import {
  deletarTodosUsuariosEmpresa,
  retornarUsuariosEmpresa,
  retornarEmpresas,
  retornarEmpresasId,
  deletarUsuario,
} from "../Controllers/enterpriseController";

import { retornarEstatisticasDashboard } from "../Controllers/dashboardController";
import { loginEmpresa, logoutEmpresa } from "../Controllers/auth/Enterprise";
import { authSession } from "../Middlewares/authMiddleware";

const router = Router();

//Empresa
router.post("/auth/register", criarEmpresa);
router.post("/auth/login", loginEmpresa);
router.post("/auth/logout", authSession, logoutEmpresa);
router.get("/", authSession, retornarEmpresas);
router.get("/:id", authSession, retornarEmpresasId);
router.get("/:empresaId/users", authSession, retornarUsuariosEmpresa);
// Retorna todas as estatisticas da empresa
router.get("/dashboard", authSession, retornarEstatisticasDashboard);
//Deletar todos os usuários da empresa
router.delete("/:id/users/delete/", authSession, deletarTodosUsuariosEmpresa);
//Deltar usuário específico da empresa
router.delete("/:id/users/delete/:userId", authSession, deletarUsuario);
export default router;
