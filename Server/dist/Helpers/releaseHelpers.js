"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarNotaFiscal = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const criarNotaFiscal = async (nota) => {
    try {
        const notaFiscal = await prisma_1.default.notaFiscal.create({
            data: {
                numero: nota.numero,
                dataEmissao: new Date(nota.dataEmissao),
                valor: nota.valor,
                xmlPath: nota.xmlPath,
                empresaId: nota.empresaId,
            },
        });
        return notaFiscal;
    }
    catch (error) {
        console.error("Erro ao criar nota fiscal:", error);
        return null;
    }
};
exports.criarNotaFiscal = criarNotaFiscal;
