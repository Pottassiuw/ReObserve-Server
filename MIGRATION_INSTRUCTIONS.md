# Instruções para Migração - Usuario ID Opcional

## Problema Resolvido
- Empresas não conseguiam criar lançamentos devido a erro de chave estrangeira no campo `usuarioId`
- O campo `usuarioId` era obrigatório mas empresas não tinham usuários associados automaticamente

## Mudanças Implementadas

### 1. Schema do Prisma (prisma/schema.prisma)
- Tornamos `usuarioId` opcional no modelo `Lancamento`
- Mudamos a relação `usuarios` para ser opcional também

### 2. Controller (src/Controllers/releaseController.ts)
- Adicionada lógica para buscar primeiro usuário da empresa quando não especificado
- Validação para garantir que usuário pertence à empresa quando especificado
- Suporte para empresas criarem lançamentos sem usuário específico
- Corrigidas funções `verLancamento` e `deletarLancamento` para empresas

### 3. Migração do Banco (NECESSÁRIA!)
Execute quando o banco estiver acessível:

```bash
cd ReObserve-Server
npx prisma migrate dev --name make_usuario_id_optional
```

OU aplique manualmente o SQL:
```sql
-- Make usuarioId optional in Lancamento table
ALTER TABLE "Lancamento" DROP CONSTRAINT "Lancamento_usuarioId_fkey";
ALTER TABLE "Lancamento" ALTER COLUMN "usuarioId" DROP NOT NULL;
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_usuarioId_fkey" 
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Resultado
- ✅ Empresas podem criar lançamentos sem erro
- ✅ Lançamentos são corretamente associados à empresa
- ✅ Se empresa tem usuários, o primeiro é usado automaticamente
- ✅ Lançamentos aparecem na listagem da empresa
- ✅ Funcionalidade completa para empresas e usuários