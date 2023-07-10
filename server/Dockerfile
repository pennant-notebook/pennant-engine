FROM node:18.16.0
WORKDIR '/src/app'

COPY package.json .
RUN npm install
COPY . .

CMD ["npm","start"]