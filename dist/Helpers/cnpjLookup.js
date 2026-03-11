"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanCNPJ = cleanCNPJ;
exports.isValidCNPJ = isValidCNPJ;
exports.formatCNPJ = formatCNPJ;
exports.normalizeEnterpriseData = normalizeEnterpriseData;
exports.lookupCNPJ = lookupCNPJ;
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const cnpjLookupResponseSchema = zod_1.z.object({
    cnpj: zod_1.z.string(),
    nomeFantasia: zod_1.z.string().nullable(),
    razaoSocial: zod_1.z.string(),
    naturezaJuridica: zod_1.z.string().optional(),
    endereco: zod_1.z.string().optional(),
    numero: zod_1.z.string().optional(),
    complemento: zod_1.z.string().optional().nullable(),
    bairro: zod_1.z.string().optional(),
    municipio: zod_1.z.string().optional(),
    uf: zod_1.z.string().optional(),
    cep: zod_1.z.string().optional(),
    CNAES: zod_1.z.string().optional(),
    situacaoCadastral: zod_1.z.string().optional(),
    dataAbertura: zod_1.z.string().optional(),
    email: zod_1.z.string().optional().nullable(),
    telefone: zod_1.z.string().optional().nullable(),
    responsavel: zod_1.z.string().optional().nullable(),
});
function cleanCNPJ(cnpj) {
    return cnpj.replace(/[^\d]+/g, "");
}
function isValidCNPJ(cnpj) {
    cnpj = cleanCNPJ(cnpj);
    if (cnpj.length !== 14)
        return false;
    if (/^(\d)\1+$/.test(cnpj))
        return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2)
            pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0)))
        return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1)))
        return false;
    return true;
}
function formatCNPJ(cnpj) {
    const clean = cleanCNPJ(cnpj);
    if (clean.length !== 14)
        return clean;
    return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12)}`;
}
function normalizeEnterpriseData(response) {
    const addressParts = [];
    if (response.endereco)
        addressParts.push(response.endereco);
    if (response.numero)
        addressParts.push(response.numero);
    if (response.complemento)
        addressParts.push(response.complemento);
    if (response.bairro)
        addressParts.push(response.bairro);
    if (response.municipio)
        addressParts.push(response.municipio);
    if (response.uf)
        addressParts.push(response.uf);
    if (response.cep)
        addressParts.push(response.cep);
    const endereco = addressParts.filter(Boolean).join(", ");
    return {
        cnpj: cleanCNPJ(response.cnpj),
        nomeFantasia: response.nomeFantasia || null,
        razaoSocial: response.razaoSocial || "",
        naturezaJuridica: response.naturezaJuridica || "",
        endereco: endereco || "",
        CNAES: response.CNAES || "",
        situacaoCadastral: response.situacaoCadastral || "",
        telefone: response.telefone || null,
        email: response.email || null,
        responsavel: response.responsavel || null,
        dataAbertura: response.dataAbertura || null,
    };
}
async function lookupCNPJws(cnpj) {
    try {
        const clean = cleanCNPJ(cnpj);
        const response = await axios_1.default.get(`https://www.cnpj.ws/json/${clean}`, {
            timeout: 5000,
            headers: {
                "User-Agent": "ReObserve/1.0",
            },
        });
        const data = response.data;
        if (!data.cnpj || !data.razaoSocial) {
            return null;
        }
        const parsed = cnpjLookupResponseSchema.parse({
            cnpj: data.cnpj,
            nomeFantasia: data.nomeFantasia || null,
            razaoSocial: data.razaoSocial,
            naturezaJuridica: data.naturezaJuridica || "",
            endereco: data.endereco || "",
            numero: data.numero || "",
            complemento: data.complemento || null,
            bairro: data.bairro || "",
            municipio: data.municipio || "",
            uf: data.uf || "",
            cep: data.cep || "",
            CNAES: data.cnaes || "",
            situacaoCadastral: data.situacaoCadastral || "",
            dataAbertura: data.dataAbertura || "",
            email: data.email || null,
            telefone: data.telefone || null,
            responsavel: data.responsavel || null,
        });
        return parsed;
    }
    catch (error) {
        console.error("CNPJ.ws lookup error:", error);
        return null;
    }
}
async function lookupCNPJ(cnpj) {
    if (!isValidCNPJ(cnpj)) {
        throw new Error("CNPJ format inválido");
    }
    try {
        let response = await lookupCNPJws(cnpj);
        if (!response) {
            return null;
        }
        return normalizeEnterpriseData(response);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`CNPJ lookup falhou: ${error.message}`);
        }
        throw new Error("CNPJ lookup falhou: erro desconhecido");
    }
}
