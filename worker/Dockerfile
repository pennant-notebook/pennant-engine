FROM node:14-alpine

WORKDIR /app
RUN adduser  -D -g '' nodeuser

COPY package*.json ./

RUN npm install

RUN chown -R nodeuser:nodeuser /app

USER nodeuser

COPY . .

CMD ["npm", "start"]
