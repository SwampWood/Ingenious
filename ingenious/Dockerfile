FROM node:20-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/build ./build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
