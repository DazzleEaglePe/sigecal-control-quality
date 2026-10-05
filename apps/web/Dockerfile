FROM node:24-alpine AS build

WORKDIR /app
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace @sigecal/shared \
    && npm run build --workspace @sigecal/web

FROM nginx:1.29-alpine AS runtime

COPY apps/web/nginx.production.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
