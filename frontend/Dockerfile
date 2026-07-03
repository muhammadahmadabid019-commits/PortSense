FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Accept Vite env vars at build time so they are baked into the production bundle
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
