"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtualizarLancamentoSchema = exports.CriarLancamentoSchema = exports.NotaFiscalBodySchema = exports.ParsedNFeSchema = void 0;
exports.parsePriceValue = parsePriceValue;
exports.validateCriarLancamentoRequest = validateCriarLancamentoRequest;
exports.validateAtualizarLancamentoRequest = validateAtualizarLancamentoRequest;
exports.validateParsedNFeData = validateParsedNFeData;
const zod_1 = require("zod");
/**
 * Validation schemas for release creation and XML processing
 */
/**
 * Parse price value from string, handling both comma and period separators.
 * Supports formats like: "10.50", "10,50", "1.234,50", "1,234.50", "R$ 10,50"
 */
function parsePriceValue(value) {
    if (!value || typeof value !== 'string') {
        throw new Error('Valor deve ser uma string válida');
    }
    let cleaned = value
        .replace(/R\$/gi, '')
        .replace(/[\s\u00A0]/g, '')
        .trim();
    if (!cleaned) {
        throw new Error('Valor não pode estar vazio');
    }
    if (/[^\d.,-]/.test(cleaned)) {
        throw new Error('Valor contém caracteres inválidos');
    }
    if (cleaned.includes('-')) {
        throw new Error('Valor deve ser positivo');
    }
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma !== -1 && lastDot !== -1) {
        const decimalSeparator = lastComma > lastDot ? ',' : '.';
        const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
        cleaned = cleaned.replace(thousandsSeparator, '');
        cleaned = decimalSeparator === ',' ? cleaned.replace(',', '.') : cleaned;
    }
    else if (lastComma !== -1) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    else {
        const dotParts = cleaned.split('.');
        if (dotParts.length > 2) {
            const decimalPart = dotParts.pop() || '';
            cleaned = `${dotParts.join('')}.${decimalPart}`;
        }
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
        throw new Error('Valor contém caracteres inválidos');
    }
    const parsed = Number.parseFloat(cleaned);
    if (Number.isNaN(parsed)) {
        throw new Error('Valor não é um número válido');
    }
    if (parsed <= 0) {
        throw new Error(parsed === 0 ? 'Valor deve ser maior que zero' : 'Valor deve ser positivo');
    }
    if (parsed > 999999999.99) {
        throw new Error('Valor está acima do permitido');
    }
    return parsed;
}
// Schema for NFe data extracted from XML
exports.ParsedNFeSchema = zod_1.z.object({
    nfeNumber: zod_1.z.string().min(1, 'Número de NFe é obrigatório'),
    emissionDate: zod_1.z.string().datetime('Data de emissão deve ser válida'),
    value: zod_1.z.number().nullable().optional(),
    rawContent: zod_1.z.string().optional(),
});
const NotaFiscalValueSchema = zod_1.z
    .union([zod_1.z.number(), zod_1.z.string()])
    .transform((value, ctx) => {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Valor não é um número válido',
            });
            return zod_1.z.NEVER;
        }
        if (value <= 0) {
            ctx.addIssue({
                code: 'custom',
                message: value === 0 ? 'Valor deve ser maior que zero' : 'Valor deve ser positivo',
            });
            return zod_1.z.NEVER;
        }
        return value;
    }
    try {
        return parsePriceValue(value);
    }
    catch (error) {
        ctx.addIssue({
            code: 'custom',
            message: error instanceof Error ? error.message : 'Valor inválido',
        });
        return zod_1.z.NEVER;
    }
});
// Schema for nota fiscal data in request body
exports.NotaFiscalBodySchema = zod_1.z.object({
    numero: zod_1.z.string().min(1, 'Número da NFe é obrigatório'),
    dataEmissao: zod_1.z.string().datetime('Data de emissão deve ser uma data válida'),
    valor: NotaFiscalValueSchema.optional().nullable(),
    xmlPath: zod_1.z.string().optional().nullable(),
    xmlContent: zod_1.z.string().optional().nullable(),
});
// Schema for complete release creation request (without XML file)
exports.CriarLancamentoSchema = zod_1.z.object({
    data_lancamento: zod_1.z.string().datetime('Data de lançamento deve ser válida'),
    latitude: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string().transform(val => parseFloat(val))
    ]).refine(val => !isNaN(val) && val >= -90 && val <= 90, 'Latitude deve estar entre -90 e 90'),
    longitude: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string().transform(val => parseFloat(val))
    ]).refine(val => !isNaN(val) && val >= -180 && val <= 180, 'Longitude deve estar entre -180 e 180'),
    notaFiscal: exports.NotaFiscalBodySchema.optional(),
    imagensUrls: zod_1.z.array(zod_1.z.string().url('URL de imagem deve ser válida')).min(1, 'Pelo menos uma imagem é necessária'),
    periodoId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(val => parseInt(val))]).optional().nullable(),
    usuarioId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(val => parseInt(val))]).optional().nullable(),
    empresaId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(val => parseInt(val))]).optional().nullable(),
});
// Schema for release update request
exports.AtualizarLancamentoSchema = zod_1.z.object({
    data_lancamento: zod_1.z.string().datetime('Data de lançamento deve ser válida').optional(),
    latitude: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string().transform(val => parseFloat(val))
    ]).refine(val => !isNaN(val) && val >= -90 && val <= 90, 'Latitude deve estar entre -90 e 90').optional(),
    longitude: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string().transform(val => parseFloat(val))
    ]).refine(val => !isNaN(val) && val >= -180 && val <= 180, 'Longitude deve estar entre -180 e 180').optional(),
    periodoId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(val => parseInt(val))]).optional().nullable(),
    notaFiscal: exports.NotaFiscalBodySchema.partial().optional(),
    imagensUrls: zod_1.z.array(zod_1.z.string().url('URL de imagem deve ser válida')).optional(),
});
function validateCriarLancamentoRequest(data) {
    try {
        const validated = exports.CriarLancamentoSchema.parse(data);
        return {
            valid: true,
            data: validated,
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.') || 'unknown',
                    message: issue.message,
                })),
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Erro ao validar dados' }],
        };
    }
}
function validateAtualizarLancamentoRequest(data) {
    try {
        const validated = exports.AtualizarLancamentoSchema.parse(data);
        return {
            valid: true,
            data: validated,
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.') || 'unknown',
                    message: issue.message,
                })),
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Erro ao validar dados' }],
        };
    }
}
function validateParsedNFeData(data) {
    try {
        const validated = exports.ParsedNFeSchema.parse(data);
        return {
            valid: true,
            data: validated,
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.') || 'unknown',
                    message: issue.message,
                })),
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Erro ao validar dados de NFe' }],
        };
    }
}
