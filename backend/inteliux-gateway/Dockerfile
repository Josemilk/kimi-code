FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.local/bin:${PATH}"
ENV KIMI_CODE_HOME=/root/.kimi-code
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl bash ca-certificates git tar \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash \
    && kimi --version

COPY package.json package-lock.json* tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build && npm prune --omit=dev

ENV PORT=8080
EXPOSE 8080
USER root
CMD ["node", "dist/server.js"]
