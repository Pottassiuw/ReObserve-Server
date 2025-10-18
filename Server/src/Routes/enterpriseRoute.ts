import { Router } from "express";
import { criarEmpresa } from "../Controllers/auth/Enterprise";
import {
  deletarTodosUsuariosEmpresa,
  retornarEmpresas,
  retornarEmpresasId,
  deletarUsuario,
} from "../Controllers/enterpriseController";

import { loginEmpresa, logoutEmpresa } from "../Controllers/auth/Enterprise";
import { authSession } from "../Middlewares/authMiddleware";

const router = Router();

//Empresa
router.post("/auth/register", criarEmpresa);
router.post("/auth/login", loginEmpresa);
router.post("/auth/logout", authSession, logoutEmpresa);
router.get("/", authSession, retornarEmpresas);
router.get("/:id", authSession, retornarEmpresasId);
//Deletar todos os usuários da empresa
router.delete("/:id/users/delete/", authSession, deletarTodosUsuariosEmpresa);
//Deltar usuário específico da empresa
router.delete("/:id/users/delete/:userId", authSession, deletarUsuario);
export default router;
