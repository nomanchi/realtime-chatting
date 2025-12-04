# 실시간 채팅 애플리케이션

Next.js와 Socket.io 기반 실시간 멀티유저 채팅 애플리케이션입니다. Flutter WebView와 PC Browser 환경을 모두 지원합니다.

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-white?logo=socket.io)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)

## ✨ 주요 기능

- 🔄 **실시간 메시징**: Socket.io를 통한 즉각적인 메시지 전송/수신
- 👥 **멀티유저 지원**: 여러 사용자 동시 접속 및 채팅
- 📱 **플랫폼 분리**: Flutter WebView 및 PC Browser 최적화 UI
- 🌓 **다크 모드**: 자동 다크 모드 지원
- 📊 **실시간 사용자 목록**: 접속 중인 사용자 실시간 표시
- 💬 **메시지 히스토리**: 이전 메시지 자동 로드
- 🔌 **자동 재연결**: 연결 끊김 시 자동 복구

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
- **Server**: Custom Next.js Server
- **Runtime**: Node.js with tsx

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/realtime-chatting.git
cd realtime-chatting

# 의존성 설치
npm install
```

### 실행

```bash
# 개발 서버 실행 (포트 3002)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

서버가 실행되면:
- **로컬**: http://localhost:3002
- **네트워크**: http://YOUR_IP:3002

## 📖 사용 방법

### PC 브라우저에서

1. http://localhost:3002/browser 접속
2. 이름 입력
3. "채팅 참여하기" 클릭
4. 채팅 시작!

**특징:**
- 우측 사이드바에 온라인 사용자 목록 표시
- 넓은 화면 레이아웃

### 모바일/WebView에서

1. http://YOUR_IP:3002/webview 접속
2. 이름 입력
3. "참여하기" 클릭
4. 채팅 시작!

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

2. 다른 기기에서 `http://YOUR_IP:3002` 접속

## 📁 프로젝트 구조

```
realtime-chatting/
├── server.ts                    # Socket.io 커스텀 서버
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 플랫폼 자동 감지 및 리다이렉트
│   │   ├── browser/
│   │   │   └── page.tsx        # PC 브라우저 페이지
│   │   └── webview/
│   │       └── page.tsx        # Flutter WebView 페이지
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
│   │   ├── platform.ts         # 플랫폼 감지
│   │   ├── socket.ts           # Socket.io 클라이언트
│   │   └── utils.ts            # 유틸리티
│   ├── store/
│   │   └── chat-store.ts       # Zustand 스토어
│   └── types/
│       └── chat.ts             # TypeScript 타입
├── package.json
└── README.md
```

## 🔌 Socket.io 이벤트

### 클라이언트 → 서버

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `user:join` | 사용자 입장 | `userName: string` |
| `message:send` | 메시지 전송 | `Message` |

### 서버 → 클라이언트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `users:list` | 사용자 목록 업데이트 | `User[]` |
| `messages:history` | 메시지 히스토리 | `Message[]` |
| `message:received` | 새 메시지 수신 | `Message` |

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
  ? `${window.location.protocol}//${window.location.hostname}:3002`
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

### 방화벽 설정 (Windows)

같은 네트워크의 다른 기기에서 접속하려면:

```powershell
# 관리자 권한 PowerShell
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3002
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
const port = 3002  // 원하는 포트로 변경
```

## 🐛 문제 해결

### 다른 기기에서 연결 안 됨

1. 방화벽 설정 확인
2. 같은 WiFi 네트워크 연결 확인
3. IP 주소 확인 (`ipconfig` 또는 `ifconfig`)

### 메시지가 전송되지 않음

1. 서버 로그 확인
2. 브라우저 콘솔 확인
3. Socket.io 연결 상태 확인 (헤더의 연결 상태)

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
