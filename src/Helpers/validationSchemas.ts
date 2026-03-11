import { z } from 'zod';

/**
 * Validation schemas for release creation and XML processing
 */

/**
 * Parse price value from string, handling both comma and period separators.
 * Supports formats like: "10.50", "10,50", "1.234,50", "1,234.50", "R$ 10,50"
 */
export function parsePriceValue(value: string): number {
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
  } else if (lastComma !== -1) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
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
export const ParsedNFeSchema = z.object({
  nfeNumber: z.string().min(1, 'Número de NFe é obrigatório'),
  emissionDate: z.string().datetime('Data de emissão deve ser válida'),
  value: z.number().nullable().optional(),
  rawContent: z.string().optional(),
});

export type ParsedNFe = z.infer<typeof ParsedNFeSchema>;

const NotaFiscalValueSchema = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Valor não é um número válido',
        });
        return z.NEVER;
      }

      if (value <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: value === 0 ? 'Valor deve ser maior que zero' : 'Valor deve ser positivo',
        });
        return z.NEVER;
      }

      return value;
    }

    try {
      return parsePriceValue(value);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Valor inválido',
      });
      return z.NEVER;
    }
  });

// Schema for nota fiscal data in request body
export const NotaFiscalBodySchema = z.object({
  numero: z.string().min(1, 'Número da NFe é obrigatório'),
  dataEmissao: z.string().datetime('Data de emissão deve ser uma data válida'),
  valor: NotaFiscalValueSchema.optional().nullable(),
  xmlPath: z.string().optional().nullable(),
  xmlContent: z.string().optional().nullable(),
});

export type NotaFiscalBody = z.infer<typeof NotaFiscalBodySchema>;

// Schema for complete release creation request (without XML file)
export const CriarLancamentoSchema = z.object({
  data_lancamento: z.string().datetime('Data de lançamento deve ser válida'),
  latitude: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val)),
    z.null(),
  ]).refine(val => val === null || (!isNaN(val) && val >= -90 && val <= 90), 'Latitude deve estar entre -90 e 90').optional().nullable(),
  longitude: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val)),
    z.null(),
  ]).refine(val => val === null || (!isNaN(val) && val >= -180 && val <= 180), 'Longitude deve estar entre -180 e 180').optional().nullable(),
  notaFiscal: NotaFiscalBodySchema.optional(),
  imagensUrls: z.array(z.string().url('URL de imagem deve ser válida')).min(1, 'Pelo menos uma imagem é necessária'),
  periodoId: z.union([z.number(), z.string().transform(val => parseInt(val))]).optional().nullable(),
  usuarioId: z.union([z.number(), z.string().transform(val => parseInt(val))]).optional().nullable(),
  empresaId: z.union([z.number(), z.string().transform(val => parseInt(val))]).optional().nullable(),
});

export type CriarLancamentoRequest = z.infer<typeof CriarLancamentoSchema>;

// Schema for release update request
export const AtualizarLancamentoSchema = z.object({
  data_lancamento: z.string().datetime('Data de lançamento deve ser válida').optional(),
  latitude: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).refine(val => !isNaN(val) && val >= -90 && val <= 90, 'Latitude deve estar entre -90 e 90').optional(),
  longitude: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).refine(val => !isNaN(val) && val >= -180 && val <= 180, 'Longitude deve estar entre -180 e 180').optional(),
  periodoId: z.union([z.number(), z.string().transform(val => parseInt(val))]).optional().nullable(),
  notaFiscal: NotaFiscalBodySchema.partial().optional(),
  imagensUrls: z.array(z.string().url('URL de imagem deve ser válida')).optional(),
});

export type AtualizarLancamentoRequest = z.infer<typeof AtualizarLancamentoSchema>;

export function validateCriarLancamentoRequest(data: any) {
  try {
    const validated = CriarLancamentoSchema.parse(data);
    return {
      valid: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export function validateAtualizarLancamentoRequest(data: any) {
  try {
    const validated = AtualizarLancamentoSchema.parse(data);
    return {
      valid: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export function validateParsedNFeData(data: any) {
  try {
    const validated = ParsedNFeSchema.parse(data);
    return {
      valid: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
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
