# 환경 변수 설정 가이드

프로젝트를 실행하기 전에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정해주세요.

## 1. `.env.local` 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요.

## 2. 환경 변수 설정

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/realtime-chatting

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_SOCKET_URL=http://localhost:4001
```

## 3. 환경 변수 설명

### MongoDB
- `MONGODB_URI`: MongoDB 연결 문자열
  - 로컬 MongoDB: `mongodb://localhost:27017/realtime-chatting`
  - MongoDB Atlas: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/realtime-chatting`

### JWT
- `JWT_SECRET`: JWT 토큰 서명에 사용되는 비밀 키 (프로덕션에서는 반드시 변경하세요!)
- `JWT_EXPIRES_IN`: JWT 토큰 만료 시간 (예: 7d, 24h, 60m)

### Server
- `NEXT_PUBLIC_API_URL`: API 서버 URL (클라이언트에서 접근 가능)
- `NEXT_PUBLIC_SOCKET_URL`: Socket.io 서버 URL (클라이언트에서 접근 가능)

## 4. MongoDB 설치 및 실행

### Windows
1. [MongoDB 다운로드](https://www.mongodb.com/try/download/community)
2. 설치 후 MongoDB 서비스 시작
3. 또는 MongoDB Compass 사용

### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu)
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 5. 프로젝트 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

서버가 시작되면:
- Next.js 앱: http://localhost:3000 (또는 자동 할당된 포트)
- Socket.io 서버: http://localhost:4001 (또는 다음 사용 가능한 포트)

## 주의사항

⚠️ **보안**
- 프로덕션 환경에서는 반드시 `JWT_SECRET`을 강력한 랜덤 문자열로 변경하세요.
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨).

⚠️ **MongoDB**
- MongoDB가 실행 중인지 확인하세요.
- 연결 문자열이 올바른지 확인하세요.

