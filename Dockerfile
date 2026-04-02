# Backend Dockerfile
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install --production

# 소스 코드 복사
COPY . .

# 실행 포트 설정
EXPOSE 5000

# 서버 실행
CMD ["node", "server.js"]
