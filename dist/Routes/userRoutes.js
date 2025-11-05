"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../Controllers/auth/User");
const userController_1 = require("../Controllers/userController");
const User_2 = require("../Controllers/auth/User");
const enterpriseController_1 = require("../Controllers/enterpriseController");
const authMiddleware_1 = require("../Middlewares/authMiddleware");
const router = (0, express_1.Router)();
//Usuarios
router.post("/auth/register", User_2.criarUsuario);
router.get("/:id", userController_1.retornarUsuarioId);
router.put("/:id", authMiddleware_1.authSession, userController_1.atualizarDados);
router.patch("/:id", authMiddleware_1.authSession, userController_1.atualizarDados);
router.delete("/:id", authMiddleware_1.authSession, enterpriseController_1.deletarUsuario);
router.post("/auth/login", User_1.loginUsuario);
router.post("/auth/logout", authMiddleware_1.authSession, User_1.logoutUsuario);
exports.default = router;
