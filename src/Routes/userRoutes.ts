import { Router } from "express";
import { loginUsuario, logoutUsuario } from "../Controllers/auth/User";
import {
  retornarUsuarioId,
  retornarUsuarios,
  atualizarDados,
} from "../Controllers/userController";
import { criarUsuario } from "../Controllers/auth/User";
import { deletarUsuario } from "../Controllers/enterpriseController";
import { authSession } from "../Middlewares/authMiddleware";
const router = Router();

//Usuarios
router.post("/auth/register", criarUsuario);
router.get("/:id", retornarUsuarioId);
router.put("/:id", authSession, atualizarDados);
router.patch("/:id", authSession, atualizarDados);
router.delete("/:id", authSession, deletarUsuario);
router.post("/auth/login", loginUsuario);
router.post("/auth/logout", authSession, logoutUsuario);

export default router;
