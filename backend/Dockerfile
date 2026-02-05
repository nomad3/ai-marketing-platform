FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Ensure data directory exists and is writable by non-root user (1000)
RUN mkdir -p /app/data && chown -R 1000:1000 /app/data

USER 1000

EXPOSE 3000

CMD ["npm", "start"]
