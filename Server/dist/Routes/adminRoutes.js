"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../Controllers/userController");
const enterpriseController_1 = require("../Controllers/enterpriseController");
const authMiddleware_1 = require("../Middlewares/authMiddleware");
const groupController_1 = require("../Controllers/groupController");
const User_1 = require("../Controllers/auth/User");
const Enterprise_1 = require("../Controllers/auth/Enterprise");
const releaseController_1 = require("../Controllers/releaseController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authSession, authMiddleware_1.requireSuperAdmin);
// Empresas
router.post("/empresas", Enterprise_1.criarEmpresa);
router.get("/empresas", enterpriseController_1.retornarEmpresas);
router.get("/empresas/:id", enterpriseController_1.retornarEmpresasId);
router.delete("/empresas/:id", enterpriseController_1.deletarEmpresa);
router.delete("/empresas/", enterpriseController_1.deletarTodasEmpresas);
// Usuários
router.post("/usuarios", User_1.criarUsuario);
router.get("/usuarios", userController_1.retornarUsuarios);
router.get("/usuarios/:id", userController_1.retornarUsuarioId);
router.delete("/usuarios/:id", enterpriseController_1.deletarUsuario);
router.delete("/empresas/:empresaId/usuarios", enterpriseController_1.deletarTodosUsuariosEmpresa);
// Grupos
router.post("/empresas/:empresaId/grupos", groupController_1.CriarGrupo);
router.get("/empresas/:empresaId/grupos", groupController_1.verGruposEmpresa);
router.post("/empresas/:empresaId/grupos/:grupoId/usuarios/:usuarioId", groupController_1.colocarUsuarioGrupo);
router.delete("/empresas/:empresaId/grupos/:grupoId", groupController_1.deletarGrupoEmpresa);
router.delete("/empresas/:empresaId/grupos", groupController_1.deletarTodosGruposEmpresa);
// Lançamentos
router.get("/lancamentos", releaseController_1.verTodosLancamentos);
exports.default = router;
