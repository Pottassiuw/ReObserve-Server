import consultarCNPJ from "consultar-cnpj";

const CNPJWS_TOKEN = process.env.CNPJWS_TOKEN ?? "";

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

  const calc = (len: number) => {
    let soma = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      soma += parseInt(cnpj.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    return soma % 11 < 2 ? 0 : 11 - (soma % 11);
  };

  return (
    calc(12) === parseInt(cnpj.charAt(12)) &&
    calc(13) === parseInt(cnpj.charAt(13))
  );
}

export function formatCNPJ(cnpj: string): string {
  const c = cleanCNPJ(cnpj);
  if (c.length !== 14) return c;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEnterpriseData(data: any): EnterpriseData {
  const est = data.estabelecimento ?? {};

  const addressParts = [
    est.tipo_logradouro,
    est.logradouro,
    est.numero,
    est.complemento,
    est.bairro,
    est.cidade?.nome,
    est.estado?.sigla,
    est.cep,
  ].filter(Boolean);

  const cnae = est.atividade_principal;
  const cnaes = cnae
    ? `${cnae.id} - ${cnae.descricao}`
    : (est.atividades_secundarias ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => `${a.id} - ${a.descricao}`)
        .join("; ");

  const responsavel =
    data.socios?.[0]?.nome ??
    data.qualificacao_do_responsavel?.descricao ??
    null;

  return {
    cnpj: cleanCNPJ(est.cnpj ?? ""),
    nomeFantasia: est.nome_fantasia || null,
    razaoSocial: data.razao_social ?? "",
    naturezaJuridica: data.natureza_juridica?.descricao ?? "",
    endereco: addressParts.join(", "),
    CNAES: cnaes,
    situacaoCadastral: est.situacao_cadastral ?? "",
    telefone:
      est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : null,
    email: est.email || null,
    responsavel,
    dataAbertura: est.data_inicio_atividade ?? null,
  };
}

export async function lookupCNPJ(cnpj: string): Promise<EnterpriseData | null> {
  if (!isValidCNPJ(cnpj)) {
    throw new Error("CNPJ format inválido");
  }

  try {
    const data = await consultarCNPJ(cleanCNPJ(cnpj), CNPJWS_TOKEN);
    if (!data) return null;
    return normalizeEnterpriseData(data);
  } catch (error) {
    throw new Error(
      `CNPJ lookup falhou: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
  }
}
