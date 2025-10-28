/*
  Warnings:

  - You are about to drop the column `razãoSocial` on the `Empresa` table. All the data in the column will be lost.
  - Added the required column `razaoSocial` to the `Empresa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Empresa" DROP COLUMN "razãoSocial",
ADD COLUMN     "razaoSocial" TEXT NOT NULL;
