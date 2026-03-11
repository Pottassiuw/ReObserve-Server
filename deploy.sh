#!/bin/bash
set -e

ACR_NAME="reobserve"
RESOURCE_GROUP="ReObserve"
CONTAINER_APP="reobserve-server"
IMAGE="reobserve.azurecr.io/reobserve-server:latest"

echo "🔨 Buildando imagem do server..."
docker build --no-cache -t $IMAGE .

echo "📤 Fazendo push para o ACR..."
docker push $IMAGE

echo "🚀 Atualizando Container App..."
az containerapp update \
  --name $CONTAINER_APP \
  --resource-group $RESOURCE_GROUP \
  --image $IMAGE

echo "✅ Deploy do server concluído!"
echo "🌐 URL: https://reobserve-server.happyisland-773d92bd.eastus.azurecontainerapps.io"
