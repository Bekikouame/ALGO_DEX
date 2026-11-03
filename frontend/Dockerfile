# Site Next.js : construit une fois, servi par le serveur autonome (output: "standalone").
FROM node:24-alpine AS construction
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Lu au build : l'adresse du moteur est figée dans les règles de relais /api/*.
ARG BACKEND_URL=http://moteur:8000
ENV BACKEND_URL=$BACKEND_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=construction --chown=node:node /app/.next/standalone ./
COPY --from=construction --chown=node:node /app/.next/static ./.next/static
COPY --from=construction --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
