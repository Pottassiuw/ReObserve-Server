"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarUsuarioSchema = exports.criarUsuarioSchema = void 0;
const zod_1 = require("zod");
exports.criarUsuarioSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1).max(48),
    cpf: zod_1.z.string().refine((cpf) => {
        if (typeof cpf !== "string")
            return false;
        cpf = cpf.replace(/[^\d]+/g, "");
        if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/))
            return false;
        const cpfDigits = cpf.split("").map((el) => +el);
        const rest = (count) => {
            return (((cpfDigits
                .slice(0, count - 12)
                .reduce((soma, el, index) => soma + el * (count - index), 0) *
                10) %
                11) %
                10);
        };
        return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
    }, "Digite um cpf válido."),
    senha: zod_1.z
        .string()
        .min(8, "Senha deve ter pelo menos 8 caracteres")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número"),
    email: zod_1.z.email({ message: "Por favor, insira um email válido!" }),
    //Espaço para validação (se necessária da FK Empresa)
    empresaId: zod_1.z.number().max(15, "Índice fora do alcançe"),
    grupoId: zod_1.z.number().max(15, "Índice fora do alcançe").optional(),
});
// Schema para atualização (campos opcionais)
exports.atualizarUsuarioSchema = exports.criarUsuarioSchema.partial().omit({
    cpf: true, // CPF não pode ser alterado
});
