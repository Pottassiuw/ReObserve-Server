"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Enterprise_1 = require("../Controllers/auth/Enterprise");
const enterpriseController_1 = require("../Controllers/enterpriseController");
const Enterprise_2 = require("../Controllers/auth/Enterprise");
const authMiddleware_1 = require("../Middlewares/authMiddleware");
const router = (0, express_1.Router)();
//Empresa
router.post("/auth/register", Enterprise_1.criarEmpresa);
router.post("/auth/login", Enterprise_2.loginEmpresa);
router.post("/auth/logout", authMiddleware_1.authSession, Enterprise_2.logoutEmpresa);
router.get("/", authMiddleware_1.authSession, enterpriseController_1.retornarEmpresas);
router.get("/:id", authMiddleware_1.authSession, enterpriseController_1.retornarEmpresasId);
router.get("/:empresaId/users", authMiddleware_1.authSession, enterpriseController_1.retornarUsuariosEmpresa);
//Deletar todos os usuários da empresa
router.delete("/:id/users/delete/", authMiddleware_1.authSession, enterpriseController_1.deletarTodosUsuariosEmpresa);
//Deltar usuário específico da empresa
router.delete("/:id/users/delete/:userId", authMiddleware_1.authSession, enterpriseController_1.deletarUsuario);
exports.default = router;
