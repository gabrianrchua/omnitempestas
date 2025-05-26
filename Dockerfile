# --- Stage 1: Build frontend ---
FROM node:22.15.0 AS frontend-builder

WORKDIR /app/frontend

ENV VITE_ENV=prod

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

# --- Stage 2: Build backend ---
FROM node:22.15.0 AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend ./
# Copy the built frontend into backend/static
COPY --from=frontend-builder /app/frontend/dist ./static

RUN npm run build

# --- Stage 3: Production image ---
FROM node:22.15.0 AS production

WORKDIR /app

# Copy backend runtime files
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/dist ./
COPY --from=backend-builder /app/backend/static ./static

RUN npm install --omit=dev

RUN npx playwright install chromium
RUN npx playwright install-deps

# Set environment variable for runtime
ENV ENV=prod

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["npm", "start"]