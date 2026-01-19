FROM node:20

WORKDIR /usr/src/app

COPY pnpm-lock.yaml* package.json* ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3002

CMD ["node", "dist/main"]