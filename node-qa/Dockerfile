FROM node:14-alpine as builder

WORKDIR /build

ADD ./flagship .

RUN yarn install
RUN yarn build-prod

FROM node:14-alpine

WORKDIR /app

ADD ./node-qa ./node-qa

COPY --from=builder build/dist/.  flagship/dist/

ADD ./flagship/package.json flagship

EXPOSE 3000

WORKDIR node-qa

RUN yarn install

CMD ["yarn","run","start"]

