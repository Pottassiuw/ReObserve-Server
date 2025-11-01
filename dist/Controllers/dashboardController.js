"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retornarEstatisticasDashboard = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const retornarEstatisticasDashboard = async (req, res) => {
    try {
        const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;
        if (!empresaId || isNaN(empresaId)) {
            return res.status(400).json({
                error: "ID da empresa inválido",
                success: false,
            });
        }
        const empresa = await prisma_1.default.empresa.findUnique({
            where: { id: empresaId },
        });
        if (!empresa) {
            return res.status(404).json({
                error: "Empresa não encontrada",
                success: false,
            });
        }
        const seiseMesesAtras = new Date();
        seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6);
        const totalNotas = await prisma_1.default.notaFiscal.count({
            where: { empresaId },
        });
        const receitaTotal = await prisma_1.default.notaFiscal.aggregate({
            where: { empresaId },
            _sum: { valor: true },
        });
        const periodoAtual = await prisma_1.default.periodo.findFirst({
            where: { empresaId },
            orderBy: { dataCriacao: "desc" },
        });
        const pendencias = await prisma_1.default.periodo.count({
            where: {
                empresaId,
                fechado: false,
            },
        });
        const notasPorMes = await prisma_1.default.notaFiscal.groupBy({
            by: ["dataEmissao"],
            where: {
                empresaId,
                dataEmissao: {
                    gte: seiseMesesAtras,
                },
            },
            _sum: {
                valor: true,
            },
            _count: true,
        });
        const dadosMensais = processarDadosMensais(notasPorMes);
        const notasPorPeriodo = await prisma_1.default.periodo.findMany({
            where: { empresaId },
            include: {
                _count: {
                    select: { lancamentos: true },
                },
            },
        });
        const atividadesRecentes = await prisma_1.default.lancamento.findMany({
            where: { empresaId },
            include: {
                notaFiscal: true,
                periodo: true,
            },
            orderBy: { dataCriacao: "desc" },
            take: 4,
        });
        const atividades = atividadesRecentes.map((atividade) => {
            const diffMs = Date.now() - atividade.dataCriacao.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHoras = Math.floor(diffMs / 3600000);
            const diffDias = Math.floor(diffMs / 86400000);
            let tempo = "";
            if (diffMins < 60) {
                tempo = `${diffMins} min atrás`;
            }
            else if (diffHoras < 24) {
                tempo = `${diffHoras} hora${diffHoras > 1 ? "s" : ""} atrás`;
            }
            else {
                tempo = `${diffDias} dia${diffDias > 1 ? "s" : ""} atrás`;
            }
            return {
                id: atividade.id,
                type: atividade.periodo?.fechado ? "success" : "warning",
                message: `NF-e ${atividade.notaFiscal.numero} ${atividade.periodo?.fechado ? "fechada" : "registrada"}`,
                time: tempo,
            };
        });
        return res.status(200).json({
            success: true,
            message: "Estatísticas carregadas com sucesso",
            data: {
                stats: {
                    receitaTotal: receitaTotal._sum.valor || 0,
                    notasEmitidas: totalNotas,
                    periodoAtual: periodoAtual
                        ? {
                            nome: formatarMesAno(periodoAtual.dataInicio),
                            status: periodoAtual.fechado ? "Fechado" : "Aberto",
                        }
                        : null,
                    pendencias: pendencias,
                },
                dadosMensais,
                atividadesRecentes: atividades,
                categorias: calcularCategorias(notasPorPeriodo),
            },
        });
    }
    catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return res.status(500).json({
            error: "Erro interno do servidor",
            success: false,
            errorType: error.constructor.name,
            message: error.message,
        });
    }
};
exports.retornarEstatisticasDashboard = retornarEstatisticasDashboard;
function processarDadosMensais(dados) {
    const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ];
    const mesesData = {};
    for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mesNome = meses[data.getMonth()];
        mesesData[mesNome] = { entradas: 0, saidas: 0 };
    }
    dados.forEach((item) => {
        const data = new Date(item.dataEmissao);
        const mesNome = meses[data.getMonth()];
        if (mesesData[mesNome]) {
            mesesData[mesNome].entradas += item._sum.valor || 0;
        }
    });
    return Object.entries(mesesData).map(([mes, valores]) => ({
        mes,
        entradas: Math.round(valores.entradas),
        saidas: Math.round(valores.entradas * 0.75), // Estimativa
    }));
}
function formatarMesAno(data) {
    const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    return `${meses[data.getMonth()]}/${data.getFullYear()}`;
}
function calcularCategorias(periodos) {
    const total = periodos.reduce((acc, p) => acc + p._count.lancamentos, 0);
    if (total === 0) {
        return [
            { name: "Produtos", value: 33 },
            { name: "Serviços", value: 33 },
            { name: "Mercadorias", value: 34 },
        ];
    }
    return [
        { name: "Produtos", value: 45 },
        { name: "Serviços", value: 30 },
        { name: "Mercadorias", value: 25 },
    ];
}
