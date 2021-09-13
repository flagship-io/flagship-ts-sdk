FROM node:12-alpine as builder

WORKDIR /build

ADD ./flagship .

RUN yarn install
RUN yarn build-prod

FROM node:12-alpine

WORKDIR /app

ADD ./node-qa ./node-qa

COPY --from=builder build/dist/.  flagship/dist/

ADD ./flagship/package.json flagship

EXPOSE 8000

WORKDIR node-qa

RUN yarn install

CMD ["yarn","run","start"]

