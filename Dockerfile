FROM node:22-alpine

ARG DEMO_MODE
ARG ENABLED_DATA_SOURCES
ARG DONOR_ID_INPUT_METHOD
ARG DONOR_SURVEY_ENABLED
ARG FEEDBACK_SURVEY_ENABLED
ARG DONOR_SURVEY_LINK
ARG FEEDBACK_SURVEY_LINK

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN mkdir -p public/sql-wasm

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000
