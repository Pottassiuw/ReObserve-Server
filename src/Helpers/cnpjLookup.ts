import axios, { AxiosError } from "axios";
import { z } from "zod";

const cnpjLookupResponseSchema = z.object({
  cnpj: z.string(),
  nomeFantasia: z.string().nullable(),
  razaoSocial: z.string(),
  naturezaJuridica: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  CNAES: z.string().optional(),
  situacaoCadastral: z.string().optional(),
  dataAbertura: z.string().optional(),
  email: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  responsavel: z.string().optional().nullable(),
});

export type CNPJLookupResponse = z.infer<typeof cnpjLookupResponseSchema>;

export interface EnterpriseData {
  cnpj: string;
  nomeFantasia: string | null;
  razaoSocial: string;
  naturezaJuridica: string;
  endereco: string;
  CNAES: string;
  situacaoCadastral: string;
  telefone: string | null;
  email: string | null;
  responsavel: string | null;
  dataAbertura: string | null;
}

export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]+/g, "");
}
export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cleanCNPJ(cnpj);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
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
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}
export function formatCNPJ(cnpj: string): string {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return clean;
  return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12)}`;
}
export function normalizeEnterpriseData(
  response: CNPJLookupResponse,
): EnterpriseData {
  const addressParts: string[] = [];

  if (response.endereco) addressParts.push(response.endereco);
  if (response.numero) addressParts.push(response.numero);
  if (response.complemento) addressParts.push(response.complemento);
  if (response.bairro) addressParts.push(response.bairro);
  if (response.municipio) addressParts.push(response.municipio);
  if (response.uf) addressParts.push(response.uf);
  if (response.cep) addressParts.push(response.cep);

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
async function lookupCNPJws(cnpj: string): Promise<CNPJLookupResponse | null> {
  try {
    const clean = cleanCNPJ(cnpj);
    const response = await axios.get(`https://www.cnpj.ws/json/${clean}`, {
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
  } catch (error) {
    console.error("CNPJ.ws lookup error:", error);
    return null;
  }
}

export async function lookupCNPJ(cnpj: string): Promise<EnterpriseData | null> {
  if (!isValidCNPJ(cnpj)) {
    throw new Error("CNPJ format inválido");
  }
  try {
    let response = await lookupCNPJws(cnpj);
    if (!response) {
      return null;
    }
    return normalizeEnterpriseData(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CNPJ lookup falhou: ${error.message}`);
    }
    throw new Error("CNPJ lookup falhou: erro desconhecido");
  }
}
