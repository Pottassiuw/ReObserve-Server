//TIPOS DA EMPRESA
export interface Empresa {
  id: number;
  cnpj: string;
  senha: string;
  nomeFantasia: string;
  razaoSocial: string;
  endereco: string;
  situacaoCadastral: string;
  naturezaJuridica: string;
  CNAES: string;
  dataCriacao: string;
}
export type EnterprisePayloadLogin = { cnpj: string; senha: string };

//TIPOS DO USUÁRIO
export interface Usuario {
  id: number;
  cpf: string;
  senha: string;
  nome: string;
  email: string;
  empresaId: number;
}
export type UserPayloadLogin = { email: string; senha: string };

//TIPOS DOS GRUPOS
import { Permissoes as PrismaPermissoes } from "@prisma/client";
export { Permissoes } from "@prisma/client";
export interface CreateGroupRequest {
  nome: string;
  permissoes: PrismaPermissoes[];
}

export interface UpdatePermissionsRequest {
  permissoes: PrismaPermissoes[];
}

export interface UpdateGroupRequest {
  nome?: string;
  permissoes?: PrismaPermissoes[];
}

/*
Tipos do Lançamento
*/

