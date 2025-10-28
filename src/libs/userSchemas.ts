import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1).max(48),
  cpf: z.string().refine((cpf: string) => {
    if (typeof cpf !== "string") return false;
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    const cpfDigits = cpf.split("").map((el) => +el);
    const rest = (count: number): number => {
      return (
        ((cpfDigits
          .slice(0, count - 12)
          .reduce((soma, el, index) => soma + el * (count - index), 0) *
          10) %
          11) %
        10
      );
    };
    return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
  }, "Digite um cpf válido."),
  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número",
    ),
  email: z.email({ message: "Por favor, insira um email válido!" }),
  //Espaço para validação (se necessária da FK Empresa)
  empresaId: z.number().max(15, "Índice fora do alcançe"),
  grupoId: z.number().max(15, "Índice fora do alcançe").optional(),
});

export type criarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
// Schema para atualização (campos opcionais)
export const atualizarUsuarioSchema = criarUsuarioSchema.partial().omit({
  cpf: true, // CPF não pode ser alterado
});
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
