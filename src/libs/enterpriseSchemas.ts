import { z } from "zod";
// Função auxiliar para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
  // Remove formatação (pontos, barras, hífens)
  cnpj = cnpj.replace(/[^\d]+/g, "");
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;
  // Verifica se não são todos iguais (11111111111111, etc)
  if (/^(\d)\1+$/.test(cnpj)) return false;
  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != parseInt(digitos.charAt(1))) return false;
  return true;
}

// Schema de validação Zod para criação de empresa
export const criarEmpresaSchema = z.object({
  cnpj: z
    .string()
    .min(1, "CNPJ é obrigatório")
    .transform((val) => val.replace(/[^\d]+/g, "")) // Remove formatação
    .refine((val) => val.length === 14, "CNPJ deve ter 14 dígitos")
    .refine((val) => isValidCNPJ(val), "CNPJ inválido"),

  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número",
    ),
  nomeFantasia: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)), // Converte string vazia para undefined

  razaoSocial: z
    .string()
    .min(1, "Razão social é obrigatória")
    .max(200, "Razão social deve ter no máximo 200 caracteres"),

  endereco: z
    .string()
    .min(1, "Endereço é obrigatório")
    .max(300, "Endereço deve ter no máximo 300 caracteres"),

  situacaoCadastral: z
    .string()
    .min(1, "Situação cadastral é obrigatória")
    .max(50, "Situação cadastral deve ter no máximo 50 caracteres"),

  naturezaJuridica: z
    .string()
    .min(1, "Natureza jurídica é obrigatória")
    .max(100, "Natureza jurídica deve ter no máximo 100 caracteres"),

  CNAES: z
    .string()
    .min(1, "CNAE é obrigatório")
    .max(500, "CNAE deve ter no máximo 500 caracteres"),
});

// Tipo TypeScript inferido do schema Zod
export type CriarEmpresaInput = z.infer<typeof criarEmpresaSchema>;

// Schema para atualização (campos opcionais)
export const atualizarEmpresaSchema = criarEmpresaSchema.partial().omit({
  cnpj: true, // CNPJ não pode ser alterado
});

export type AtualizarEmpresaInput = z.infer<typeof atualizarEmpresaSchema>;
