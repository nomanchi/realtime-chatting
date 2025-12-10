# 실시간 채팅 애플리케이션

Next.js와 Socket.io 기반 실시간 멀티유저 채팅 애플리케이션입니다. JWT 인증, MongoDB 데이터베이스, Flutter WebView와 PC Browser 환경을 모두 지원합니다.

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-white?logo=socket.io)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)

## ✨ 주요 기능

- 🔄 **실시간 메시징**: Socket.io를 통한 즉각적인 메시지 전송/수신
- 🔐 **JWT 인증 시스템**: 안전한 사용자 인증 및 세션 관리
- 💾 **MongoDB 데이터베이스**: 사용자 정보 및 메시지 영구 저장
- 👥 **멀티유저 지원**: 여러 사용자 동시 접속 및 채팅
- 📱 **플랫폼 분리**: Flutter WebView 및 PC Browser 최적화 UI
- 🌓 **다크 모드**: 자동 다크 모드 지원
- 📊 **실시간 사용자 목록**: 접속 중인 사용자 실시간 표시
- 💬 **메시지 히스토리**: DB에서 이전 메시지 자동 로드
- 🔌 **자동 재연결**: 연결 끊김 시 자동 복구
- 👤 **익명 채팅 지원**: 로그인 없이도 채팅 가능

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16.0.7 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **State Management**: Zustand 5
- **Data Fetching**: @tanstack/react-query 5
- **Icons**: Lucide React
- **Date**: date-fns 4

### Backend
- **Real-time**: Socket.io 4.8.1
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Server**: Custom Next.js Server
- **Runtime**: Node.js with tsx

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- npm 또는 yarn
- MongoDB (로컬 또는 MongoDB Atlas)

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/realtime-chatting.git
cd realtime-chatting

# 의존성 설치
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

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

> 📝 자세한 환경 변수 설정 가이드는 [ENV_SETUP.md](./ENV_SETUP.md)를 참조하세요.

### MongoDB 설정

#### 로컬 MongoDB
```bash
# Windows - MongoDB 서비스 시작
# macOS (Homebrew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas (클라우드)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 무료 계정 생성
2. 클러스터 생성
3. 연결 문자열을 `.env.local`의 `MONGODB_URI`에 설정

### 실행

```bash
# 개발 서버 실행
npm run dev
```

서버가 실행되면:
- **Next.js 앱**: http://localhost:4001 (또는 자동 할당된 포트)
- **Socket.io 서버**: http://localhost:4001 (또는 다음 사용 가능한 포트)
- **로그인 페이지**: http://localhost:4001/login
- **회원가입 페이지**: http://localhost:4001/register
- **채팅 (브라우저)**: http://localhost:4001/browser
- **채팅 (WebView)**: http://localhost:4001/webview

## 📚 문서

- **[개발자 가이드](./DEVELOPER_GUIDE.md)**: 개발자를 위한 상세한 기술 문서
- **[사용자 가이드](./USER_GUIDE.md)**: 사용자를 위한 기능 사용 가이드
- **[환경 변수 설정](./ENV_SETUP.md)**: 환경 변수 설정 상세 가이드

## 📖 사용 방법

### 회원가입 및 로그인

1. http://localhost:4001 접속
2. "회원가입" 클릭
3. 이메일, 사용자명, 비밀번호 입력
4. 자동으로 로그인되어 채팅으로 이동

> 📖 더 자세한 사용 방법은 [사용자 가이드](./USER_GUIDE.md)를 참조하세요.

### PC 브라우저에서

**인증된 사용자:**
- 로그인 후 자동으로 채팅 참여
- 메시지가 DB에 저장됨
- 로그아웃 버튼으로 세션 종료

**익명 사용자:**
1. http://localhost:4001/browser 접속
2. 이름 입력
3. "채팅 참여하기" 클릭
4. 채팅 시작! (메시지는 메모리에만 저장)

**특징:**
- 우측 사이드바에 온라인 사용자 목록 표시
- 넓은 화면 레이아웃
- 인증된 사용자 표시

### 모바일/WebView에서

1. http://YOUR_IP:4001/webview 접속
2. 로그인
3. 채팅 시작!

**특징:**
- 모바일 최적화 UI
- 터치 친화적 인터페이스

### 다른 기기에서 접속

같은 WiFi 네트워크에 연결된 기기에서:

1. PC에서 IP 주소 확인:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. 다른 기기에서 `http://YOUR_IP:4001` 접속

## 📁 프로젝트 구조

```
realtime-chatting/
├── server.ts                    # Socket.io 커스텀 서버 (JWT 인증 포함)
├── ENV_SETUP.md                 # 환경 변수 설정 가이드
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 랜딩 페이지 (로그인/회원가입)
│   │   ├── login/
│   │   │   └── page.tsx        # 로그인 페이지
│   │   ├── register/
│   │   │   └── page.tsx        # 회원가입 페이지
│   │   ├── browser/
│   │   │   └── page.tsx        # PC 브라우저 채팅 페이지
│   │   ├── webview/
│   │   │   └── page.tsx        # Flutter WebView 채팅 페이지
│   │   └── api/
│   │       └── auth/           # 인증 API Routes
│   │           ├── register/
│   │           ├── login/
│   │           ├── logout/
│   │           └── me/
│   ├── components/
│   │   ├── ui/                 # UI 기본 컴포넌트
│   │   │   ├── avatar.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── scroll-area.tsx
│   │   └── chat/               # 채팅 컴포넌트
│   │       ├── ChatHeader.tsx
│   │       ├── MessageInput.tsx
│   │       └── MessageList.tsx
│   ├── lib/
│   │   ├── mongodb.ts          # MongoDB 연결
│   │   ├── jwt.ts              # JWT 토큰 생성/검증
│   │   ├── auth.ts             # 인증 미들웨어
│   │   ├── api.ts              # API 클라이언트
│   │   ├── platform.ts         # 플랫폼 감지
│   │   ├── socket.ts           # Socket.io 클라이언트
│   │   └── utils.ts            # 유틸리티
│   ├── models/
│   │   ├── User.ts             # User Mongoose 모델
│   │   └── Message.ts          # Message Mongoose 모델
│   ├── store/
│   │   ├── auth-store.ts       # 인증 상태 관리 (Zustand)
│   │   └── chat-store.ts       # 채팅 상태 관리 (Zustand)
│   └── types/
│       └── chat.ts             # TypeScript 타입
├── package.json
└── README.md
```

## 🔌 API 엔드포인트

### 인증 API

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |

### Socket.io 이벤트

#### 클라이언트 → 서버

| 이벤트 | 설명 | 데이터 | 인증 |
|--------|------|--------|------|
| `user:join` | 사용자 입장 | `userName: string` | 선택 |
| `message:send` | 메시지 전송 | `Message` | 선택 |
| `user:typing` | 타이핑 중 | `userName: string` | 선택 |
| `user:stop-typing` | 타이핑 종료 | - | 선택 |

#### 서버 → 클라이언트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `users:list` | 사용자 목록 업데이트 | `User[]` |
| `messages:history` | 메시지 히스토리 (DB에서 로드) | `Message[]` |
| `message:received` | 새 메시지 수신 | `Message` |
| `user:typing` | 다른 사용자 타이핑 중 | `{ userId, userName }` |
| `user:stop-typing` | 타이핑 종료 | `userId` |

> 💡 **인증된 사용자**: JWT 토큰과 함께 Socket 연결 시 메시지가 MongoDB에 저장됩니다.
> 💡 **익명 사용자**: 메시지가 메모리에만 저장되며 서버 재시작 시 사라집니다.

## 🌐 배포

### Vercel (Frontend Only)

```bash
npm i -g vercel
vercel --prod
```

> ⚠️ **주의**: Vercel의 Serverless 환경에서는 Socket.io가 제한적으로 작동합니다.

### 완전한 WebSocket 지원 (추천)

Socket.io 서버를 위한 전용 호스팅:

- **Railway.app** (추천)
- **Render.com** (무료 티어)
- **Heroku**
- **자체 VPS** (DigitalOcean, AWS EC2)

배포 후 `src/lib/socket.ts`에서 서버 URL 업데이트:

```typescript
const serverUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:4001`
  : 'https://your-deployed-server.com'  // 배포된 서버 URL로 변경
```

## 📱 Flutter 통합

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ChatWebView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebView(
          initialUrl: 'https://your-app-url.com/webview',
          javascriptMode: JavascriptMode.unrestricted,
          userAgent: 'flutter-webview',
        ),
      ),
    );
  }
}
```

## 🔧 환경 설정

### 보안 설정

#### JWT Secret 생성

프로덕션 환경에서는 강력한 랜덤 문자열을 사용하세요:

```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

생성된 문자열을 `.env.local`의 `JWT_SECRET`에 설정하세요.

### 방화벽 설정 (Windows)

같은 네트워크의 다른 기기에서 접속하려면:

```powershell
# 관리자 권한 PowerShell
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=4001
netsh advfirewall firewall add rule name="Socket.io Server" dir=in action=allow protocol=TCP localport=4001
```

## 🎨 커스터마이징

### 색상 테마 변경

`src/app/globals.css`에서 CSS 변수 수정:

```css
:root {
  --primary: 221 83% 53%;        /* 파란색 */
  --background: 0 0% 100%;       /* 흰색 */
  /* ... */
}
```

### 포트 변경

`server.ts`에서:

```typescript
let port = 4001  // 원하는 포트로 변경 (자동으로 다음 포트 시도)
```

> 💡 포트가 이미 사용 중이면 자동으로 다음 포트(4002, 4003...)를 시도합니다.

## 🐛 문제 해결

### MongoDB 연결 오류

**오류**: `MONGODB_URI 환경 변수를 .env.local에 추가해주세요.`

**해결**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. `MONGODB_URI` 값이 올바른지 확인
3. MongoDB가 실행 중인지 확인

### 인증 오류

**오류**: `유효하지 않은 토큰입니다.`

**해결**:
1. 로그아웃 후 다시 로그인
2. 브라우저 쿠키 삭제
3. `JWT_SECRET`이 설정되어 있는지 확인

### 다른 기기에서 연결 안 됨

1. 방화벽 설정 확인 (포트 4001 허용)
2. 같은 WiFi 네트워크 연결 확인
3. IP 주소 확인 (`ipconfig` 또는 `ifconfig`)
4. `.env.local`의 URL을 네트워크 IP로 변경

### 메시지가 전송되지 않음

1. 서버 로그 확인
2. 브라우저 콘솔 확인
3. Socket.io 연결 상태 확인
4. MongoDB 연결 상태 확인

### 포트 충돌

**오류**: `Error: listen EADDRINUSE: address already in use :::4001`

**해결**: 자동으로 다음 포트로 시도합니다. 또는 실행 중인 프로세스를 종료하세요:

```bash
# Windows
netstat -ano | findstr :4001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4001 | xargs kill -9
```

## 📝 라이선스

MIT License

## 👤 작성자

**정의성**
- Email: esjeong@apti.co.kr

## 🙏 감사의 말

- [Next.js](https://nextjs.org/)
- [Socket.io](https://socket.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
