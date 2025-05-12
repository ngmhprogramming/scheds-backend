FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

USER node

COPY . .

EXPOSE 3000

CMD [ "node", "app.js" ]
