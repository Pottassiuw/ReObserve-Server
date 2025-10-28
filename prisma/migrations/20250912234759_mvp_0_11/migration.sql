/*
  Warnings:

  - You are about to drop the column `natureza_juridica` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `nome_fantasia` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `razão_social` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `situacao_cadastral` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `data_fim` on the `Periodo` table. All the data in the column will be lost.
  - Added the required column `naturezaJuridica` to the `Empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razãoSocial` to the `Empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `situacaoCadastral` to the `Empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataFim` to the `Periodo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Empresa" DROP COLUMN "natureza_juridica",
DROP COLUMN "nome_fantasia",
DROP COLUMN "razão_social",
DROP COLUMN "situacao_cadastral",
ADD COLUMN     "naturezaJuridica" TEXT NOT NULL,
ADD COLUMN     "nomeFantasia" TEXT,
ADD COLUMN     "razãoSocial" TEXT NOT NULL,
ADD COLUMN     "situacaoCadastral" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Periodo" DROP COLUMN "data_fim",
ADD COLUMN     "dataFim" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "dataInicio" SET DEFAULT CURRENT_TIMESTAMP;
