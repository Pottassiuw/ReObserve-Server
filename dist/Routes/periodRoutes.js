"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const periodController_1 = require("../Controllers/periodController");
const authMiddleware_1 = require("../Middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authSession);
router.get("/", periodController_1.listarPeriodos);
router.post("/", periodController_1.criarPeriodo);
router.get("/:id", periodController_1.verPeriodo);
// Buscar lançamentos disponíveis para fechar período
router.get("/:periodoId/available-releases", periodController_1.buscarLancamentosDisponiveis);
router.post("/:id/close", periodController_1.fecharPeriodo);
router.post("/:id/reopen", periodController_1.reabrirPeriodo);
router.delete("/:id", periodController_1.deletarPeriodo);
exports.default = router;
