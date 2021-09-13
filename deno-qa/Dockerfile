FROM node:14-alpine as builder

WORKDIR /build

ADD ./flagship .

RUN yarn install
RUN yarn build-prod

FROM denoland/deno:alpine

WORKDIR /app

ADD ./deno-qa ./deno-qa

COPY --from=builder build/dist-deno/.  flagship/dist-deno/

EXPOSE 3000

WORKDIR deno-qa
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache index.ts

CMD ["run", "--allow-net", "--allow-read", "index.ts"]