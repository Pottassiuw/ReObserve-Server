FROM node:24-alpine

RUN npm install -g pnpm

WORKDIR /build

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 4000

CMD ["node", "dist/index.js"]
