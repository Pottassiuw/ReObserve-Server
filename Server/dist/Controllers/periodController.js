"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removerPeriodo = exports.criarPeriodo = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const criarPeriodo = async (req, res) => {
    try {
        const empresaId = req.auth.enterprise?.id;
        if (!empresaId) {
            return res.status(400).json({
                code: "ENTERPRISE_ID_NOT_FOUND",
                error: "O id da empresa não foi fornecido, verifique a entrada de dados!",
            });
        }
        const { dataInicio, valorTotal, dataFim, lancamentosId } = req.body;
        if (!dataInicio || !valorTotal || !dataFim) {
            return res.status(400).json({
                code: "VALUES_NOT_FOUND_OR_GIVEN",
                error: "Valores não enviados, verifique os dados inseridos",
            });
        }
        if (!lancamentosId || !Array.isArray(lancamentosId)) {
            return res.status(200).json({
                code: "RELEASES_IDS_NOT_FOUND",
                error: "Os ids não foram enviados ou não estão em formato de ARRAY!",
            });
        }
        const periodo = await prisma_1.default.periodo.create({
            data: {
                dataInicio,
                valorTotal,
                dataFim,
                lancamentos: {
                    connect: lancamentosId.map((id) => ({ id })),
                },
            },
            include: {
                lancamentos: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Periodo criado com sucesso",
            Periodo: periodo,
        });
    }
    catch (error) {
        console.error("Erro ao deletar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.criarPeriodo = criarPeriodo;
const removerPeriodo = async (req, res) => {
    try {
        const { periodoId } = req.params;
        const id = parseInt(periodoId);
        if (!id) {
            return res.status(400).json({
                code: "PERIOD_ID_NOT_FOUND",
                error: "O id do período não foi fornecido, verifique a entrada de dados!",
                success: false,
            });
        }
        await prisma_1.default.periodo.delete({ where: { id } });
        return res.status(200).json({
            code: "PERIOD_DELETED",
            message: "Período deletado com sucesso!",
            success: true,
        });
    }
    catch (error) {
        console.error("Erro ao deletar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.removerPeriodo = removerPeriodo;
