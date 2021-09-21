FROM node:14-alpine as builder

WORKDIR /build

ADD . .

RUN yarn install
RUN yarn build

FROM node:6-alpine

WORKDIR /app

ADD ./demo demo

COPY --from=builder build/dist/.  dist/

ADD ./package.json .

EXPOSE 8000

WORKDIR /app/demo

RUN yarn install

CMD ["yarn","run","start"]

