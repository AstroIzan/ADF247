FROM node:24-bookworm-slim AS build

WORKDIR /app

ARG FIREBASE_WEB_CONFIG_JSON
ARG FIREBASE_WEB_VAPID_KEY

COPY package*.json ./

RUN npm ci

COPY . .

RUN if [ -n "${FIREBASE_WEB_CONFIG_JSON}" ] || [ -n "${FIREBASE_WEB_VAPID_KEY}" ]; then \
      test -n "${FIREBASE_WEB_CONFIG_JSON}" && test -n "${FIREBASE_WEB_VAPID_KEY}"; \
      FIREBASE_WEB_CONFIG_JSON="${FIREBASE_WEB_CONFIG_JSON}" \
      FIREBASE_WEB_VAPID_KEY="${FIREBASE_WEB_VAPID_KEY}" \
      node scripts/configure-firebase.cjs; \
    fi

RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/client-app/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]