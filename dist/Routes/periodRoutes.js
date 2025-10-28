"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// periodRoutes.ts
const express_1 = require("express");
const periodController_1 = require("../Controllers/periodController");
const authMiddleware_1 = require("../Middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas as rotas precisam de autenticação
router.use(authMiddleware_1.authSession);
// Listar períodos
router.get("/", periodController_1.listarPeriodos);
// Criar período
router.post("/", periodController_1.criarPeriodo);
// Ver período específico
router.get("/:id", periodController_1.verPeriodo);
// Buscar lançamentos disponíveis para fechar período
router.get("/:periodoId/available-releases", periodController_1.buscarLancamentosDisponiveis);
// Fechar período
router.post("/:id/close", periodController_1.fecharPeriodo);
// Reabrir período
router.post("/:id/reopen", periodController_1.reabrirPeriodo);
// Deletar período
router.delete("/:id", periodController_1.deletarPeriodo);
exports.default = router;
