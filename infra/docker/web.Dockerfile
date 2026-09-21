# syntax=docker/dockerfile:1.7

FROM node:24.21.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /workspace

FROM base AS build
ARG QURAN_FEHAM_API_ORIGIN=http://api:4000
ENV QURAN_FEHAM_API_ORIGIN=$QURAN_FEHAM_API_ORIGIN
ARG NEXT_PUBLIC_APP_ORIGIN=https://fehmequran.org
ENV NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @quran-feham/web... build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /workspace /workspace
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@quran-feham/web", "start"]
