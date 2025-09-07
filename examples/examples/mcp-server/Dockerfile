FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY index.js .
ENV PORT=8090
EXPOSE 8090
CMD ["node", "index.js"]