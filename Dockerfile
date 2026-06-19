FROM node:20-alpine

WORKDIR /home/node/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm install -g serve

USER node

CMD ["serve", "-s", "dist", "-l", "7860"]