# 개발자 가이드

이 문서는 실시간 채팅 애플리케이션의 개발자를 위한 기술 가이드입니다.

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [아키텍처](#아키텍처)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 기능 구현](#핵심-기능-구현)
5. [API 문서](#api-문서)
6. [Socket.io 이벤트](#socketio-이벤트)
7. [데이터베이스 스키마](#데이터베이스-스키마)
8. [상태 관리](#상태-관리)
9. [개발 워크플로우](#개발-워크플로우)
10. [디버깅](#디버깅)
11. [테스트](#테스트)
12. [배포](#배포)

---

## 프로젝트 개요

### 기술 스택

**Frontend:**
- Next.js 16.0.7 (App Router)
- TypeScript 5
- React 19.2.0
- TailwindCSS 4
- Zustand 5 (상태 관리)
- @tanstack/react-query 5 (데이터 페칭)
- Socket.io Client 4.5.0

**Backend:**
- Node.js with tsx
- Next.js API Routes
- Socket.io Server 4.8.1
- MongoDB with Mongoose 9.0.0
- JWT (jsonwebtoken)
- bcryptjs

### 주요 기능

1. **인증 시스템**: JWT 기반 사용자 인증
2. **채팅방 시스템**: 1:1 채팅 및 그룹 채팅
3. **친구 시스템**: 친구 요청/수락/거절
4. **실시간 메시징**: Socket.io 기반 WebSocket 통신
5. **프로필 관리**: 사용자 프로필 및 아바타
6. **플랫폼 분리**: Browser/WebView 최적화

---

## 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser/WebView)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React UI   │  │   Zustand    │  │ Socket.io    │  │
│  │  Components  │  │    Store     │  │   Client     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │                    │
                          │ HTTP/REST          │ WebSocket
                          ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (server.ts)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes  │  │ Socket.io    │  │   MongoDB    │  │
│  │  (Next.js)   │  │   Server     │  │  Connection  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Users   │  │ Messages │  │ChatRooms │  │Friends │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 데이터 흐름

1. **인증 흐름**:
   ```
   Client → POST /api/auth/login → JWT 생성 → Cookie 설정 → Client
   ```

2. **메시지 전송 흐름**:
   ```
   Client → Socket.io (message:send) → Server → MongoDB 저장 →
   Socket.io (message:received) → 모든 클라이언트
   ```

3. **채팅방 조회 흐름**:
   ```
   Client → GET /api/chatrooms → MongoDB 조회 →
   사용자별 커스텀 이름/읽음 상태 포함 → Client
   ```

---

## 프로젝트 구조

### 디렉토리 구조

```
realtime-chatting/
├── server.ts                    # Socket.io 커스텀 서버
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/            # 인증 API
│   │   │   ├── chatrooms/       # 채팅방 API
│   │   │   ├── friends/          # 친구 API
│   │   │   ├── profile/         # 프로필 API
│   │   │   └── users/           # 사용자 검색 API
│   │   ├── chat/                # 채팅 페이지
│   │   ├── chatrooms/           # 채팅방 목록 페이지
│   │   ├── friends/             # 친구 목록 페이지
│   │   ├── profile/             # 프로필 페이지
│   │   ├── settings/            # 설정 페이지
│   │   ├── browser/             # PC 브라우저 채팅
│   │   └── webview/             # 모바일 WebView 채팅
│   ├── components/              # React 컴포넌트
│   │   ├── ui/                  # 기본 UI 컴포넌트
│   │   ├── chat/                # 채팅 관련 컴포넌트
│   │   └── layout/              # 레이아웃 컴포넌트
│   ├── lib/                     # 유틸리티 및 헬퍼
│   │   ├── mongodb.ts           # MongoDB 연결
│   │   ├── jwt.ts               # JWT 토큰 관리
│   │   ├── auth.ts              # 인증 미들웨어
│   │   ├── api.ts               # API 클라이언트
│   │   ├── socket.ts            # Socket.io 클라이언트
│   │   └── platform.ts          # 플랫폼 감지
│   ├── models/                  # Mongoose 모델
│   │   ├── User.ts              # 사용자 모델
│   │   ├── Message.ts           # 메시지 모델
│   │   ├── ChatRoom.ts          # 채팅방 모델
│   │   └── Friend.ts            # 친구 관계 모델
│   ├── store/                   # Zustand 스토어
│   │   ├── auth-store.ts        # 인증 상태
│   │   ├── chat-store.ts        # 채팅 상태
│   │   └── theme-store.ts       # 테마 상태
│   └── types/                    # TypeScript 타입
│       └── chat.ts               # 채팅 관련 타입
├── .env.local                    # 환경 변수 (로컬)
├── .env                          # 환경 변수 (공통)
└── package.json
```

### 주요 파일 설명

#### `server.ts`
- Socket.io 커스텀 서버
- MongoDB 연결 초기화
- JWT 인증 미들웨어
- 실시간 메시지 처리

#### `src/lib/mongodb.ts`
- MongoDB 연결 관리
- 연결 캐싱 (개발 환경 최적화)

#### `src/lib/socket.ts`
- Socket.io 클라이언트 매니저
- 연결 관리 및 이벤트 핸들링

#### `src/store/auth-store.ts`
- 사용자 인증 상태 관리
- JWT 토큰 저장 (localStorage)
- Zustand persist 미들웨어 사용

---

## 핵심 기능 구현

### 1. 인증 시스템

#### JWT 토큰 생성 (`src/lib/jwt.ts`)

```typescript
export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    username: user.username
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions)
}
```

#### 인증 미들웨어 (`src/lib/auth.ts`)

```typescript
export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const token = getTokenFromRequest(req)

  if (!token) {
    throw new Error('인증이 필요합니다.')
  }

  const user = verifyToken(token)

  if (!user) {
    throw new Error('유효하지 않은 토큰입니다.')
  }

  return user
}
```

### 2. Socket.io 인증

#### 서버 사이드 (`server.ts`)

```typescript
io.use((socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth.token ||
    socket.handshake.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return next() // 익명 사용자 허용
  }

  const decoded = verifySocketToken(token)
  if (decoded) {
    socket.userId = decoded.userId
    socket.userEmail = decoded.email
    socket.username = decoded.username
  }

  next()
})
```

#### 클라이언트 사이드 (`src/lib/socket.ts`)

```typescript
connect(userName: string, token?: string) {
  this.socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined
  })
}
```

### 3. 채팅방 시스템

#### 1:1 채팅방 생성

```typescript
// 중복 방지: 기존 채팅방이 있으면 재사용
const existingRoom = await ChatRoom.findDirectChatRoom(userId1, userId2)

if (existingRoom) {
  return existingRoom
}

// 새 채팅방 생성
const newRoom = await ChatRoom.create({
  type: 'direct',
  members: [userId1, userId2],
  createdBy: userId1
})
```

#### 그룹 채팅방 생성

```typescript
const groupRoom = await ChatRoom.create({
  type: 'group',
  name: '그룹 채팅방',
  members: [userId1, userId2, userId3, ...],
  createdBy: currentUserId
})
```

### 4. 메시지 저장

#### 인증된 사용자 메시지

```typescript
if (socket.userId) {
  const dbMessage = await MessageModel.create({
    content: message.content,
    senderId: new mongoose.Types.ObjectId(socket.userId),
    senderName: socket.username || message.senderName,
    imageData: message.imageData,
    timestamp: Date.now(),
    status: 'sent'
  })

  // 채팅방의 lastMessage 업데이트
  await ChatRoom.findByIdAndUpdate(roomId, {
    lastMessage: message.content,
    lastMessageAt: new Date()
  })
}
```

### 5. 친구 시스템

#### 친구 요청

```typescript
// 중복 요청 방지
const existingRequest = await Friend.findOne({
  $or: [
    { requester: userId, recipient: targetUserId },
    { requester: targetUserId, recipient: userId }
  ]
})

if (existingRequest) {
  throw new Error('이미 친구 요청이 존재합니다.')
}

// 새 친구 요청 생성
await Friend.create({
  requester: userId,
  recipient: targetUserId,
  status: 'pending'
})
```

#### 친구 수락

```typescript
await Friend.findOneAndUpdate(
  { requester: targetUserId, recipient: userId, status: 'pending' },
  { status: 'accepted' }
)
```

---

## API 문서

### 인증 API

#### POST `/api/auth/register`
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "avatar": ""
  },
  "token": "jwt_token"
}
```

#### POST `/api/auth/login`
로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** (register와 동일)

#### GET `/api/auth/me`
현재 사용자 정보 조회

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "avatar": "",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 채팅방 API

#### GET `/api/chatrooms`
채팅방 목록 조회

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "chatRooms": [
    {
      "_id": "room_id",
      "name": "그룹 채팅방",
      "customName": "내가 설정한 이름",
      "type": "direct" | "group",
      "members": [...],
      "lastMessage": "마지막 메시지",
      "lastMessageAt": "2024-01-01T00:00:00.000Z",
      "unreadCount": 5,
      "otherMember": {...}  // 1:1 채팅인 경우
    }
  ]
}
```

#### POST `/api/chatrooms`
새 채팅방 생성

**Request Body:**
```json
{
  "type": "direct" | "group",
  "memberIds": ["user_id1", "user_id2"],
  "name": "그룹 채팅방 이름"  // 그룹 채팅인 경우
}
```

#### GET `/api/chatrooms/[id]/messages`
채팅방 메시지 조회

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 메시지 수 (기본값: 50)

### 친구 API

#### GET `/api/friends`
친구 목록 조회

**Query Parameters:**
- `status`: `pending` | `accepted` | `rejected`

#### POST `/api/friends/request`
친구 요청

**Request Body:**
```json
{
  "userId": "target_user_id"
}
```

#### POST `/api/friends/[id]/accept`
친구 요청 수락

---

## Socket.io 이벤트

### 클라이언트 → 서버

#### `user:join`
사용자 입장

```typescript
socket.emit('user:join', userName: string)
```

#### `message:send`
메시지 전송

```typescript
socket.emit('message:send', {
  content: string,
  senderName: string,
  senderId?: string,
  imageData?: string
})
```

#### `user:typing`
타이핑 중 표시

```typescript
socket.emit('user:typing', userName: string)
```

#### `user:stop-typing`
타이핑 종료

```typescript
socket.emit('user:stop-typing')
```

### 서버 → 클라이언트

#### `messages:history`
메시지 히스토리 (최근 100개)

```typescript
socket.on('messages:history', (messages: Message[]) => {
  // 메시지 목록 처리
})
```

#### `message:received`
새 메시지 수신

```typescript
socket.on('message:received', (message: Message) => {
  // 새 메시지 처리
})
```

#### `users:list`
온라인 사용자 목록 업데이트

```typescript
socket.on('users:list', (users: User[]) => {
  // 사용자 목록 업데이트
})
```

---

## 데이터베이스 스키마

### User 모델

```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  username: string (unique, required)
  avatar?: string
  chatRooms: [{
    roomId: ObjectId,
    customName?: string,
    lastReadMessageId?: ObjectId
  }]
  createdAt: Date
  updatedAt: Date
}
```

### Message 모델

```typescript
{
  content: string (required)
  senderId: ObjectId (ref: User, required)
  senderName: string (required)
  roomId?: ObjectId (ref: ChatRoom)
  imageData?: string
  timestamp: number (required)
  status: 'sent' | 'delivered' | 'read'
  createdAt: Date
  updatedAt: Date
}
```

### ChatRoom 모델

```typescript
{
  name?: string
  type: 'direct' | 'group' (required)
  members: [ObjectId] (ref: User, required)
  lastMessage?: string
  lastMessageAt?: Date
  createdBy: ObjectId (ref: User, required)
  createdAt: Date
  updatedAt: Date
}
```

### Friend 모델

```typescript
{
  requester: ObjectId (ref: User, required)
  recipient: ObjectId (ref: User, required)
  status: 'pending' | 'accepted' | 'rejected' (default: 'pending')
  createdAt: Date
  updatedAt: Date
}
```

**인덱스:**
- `{ requester: 1, recipient: 1 }` (unique) - 중복 요청 방지
- `{ status: 1 }` - 상태별 조회
- `{ requester: 1, status: 1 }` - 요청자별 조회
- `{ recipient: 1, status: 1 }` - 수신자별 조회

---

## 상태 관리

### Zustand 스토어

#### `auth-store.ts`
인증 상태 관리

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User | null) => void
}
```

**Persist 설정:**
- localStorage에 자동 저장
- 페이지 새로고침 시 상태 유지

#### `chat-store.ts`
채팅 상태 관리

```typescript
interface ChatState {
  currentUser: User | null
  messages: Message[]
  onlineUsers: User[]
  connectionStatus: 'connected' | 'disconnected' | 'error'

  addMessage: (message: Message) => void
  setOnlineUsers: (users: User[]) => void
  setConnectionStatus: (status: string) => void
}
```

---

## 개발 워크플로우

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# MongoDB 실행 (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 코드 구조

#### 새 API Route 추가

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const authUser = await requireAuth(req)

    // 로직 구현

    return NextResponse.json({ success: true, data: ... })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

#### 새 컴포넌트 추가

```typescript
// src/components/example/ExampleComponent.tsx
'use client'

import { useState } from 'react'

export function ExampleComponent() {
  const [state, setState] = useState('')

  return (
    <div>
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```

### 4. Git 워크플로우

```bash
# 새 기능 브랜치 생성
git checkout -b feature/new-feature

# 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 푸시
git push origin feature/new-feature
```

---

## 디버깅

### 서버 로그

서버 실행 시 다음 로그가 표시됩니다:

```
🔍 환경 변수 파일 로드 시도...
✅ 환경 변수 로드 완료
   MONGODB_URI: 설정됨
   JWT_SECRET: 설정됨
✅ MongoDB 연결 성공
> Ready on http://localhost:4001
> Socket.io server running
```

### 클라이언트 디버깅

#### Socket.io 연결 확인

```typescript
// 브라우저 콘솔
socketManager.socket?.connected  // true/false
```

#### 상태 확인

```typescript
// Zustand 스토어 상태 확인
import { useAuthStore } from '@/store/auth-store'

const { user, token, isAuthenticated } = useAuthStore()
console.log({ user, token, isAuthenticated })
```

### MongoDB 쿼리 디버깅

Mongoose 쿼리에 `.explain()` 추가:

```typescript
const result = await User.find({ email: 'test@example.com' })
  .explain('executionStats')
console.log(result)
```

---

## 테스트

### API 테스트 (예시)

```bash
# 회원가입
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"testuser"}'

# 로그인
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 채팅방 목록 (토큰 필요)
curl http://localhost:4001/api/chatrooms \
  -H "Authorization: Bearer <token>"
```

---

## 배포

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 환경 변수 설정

프로덕션 환경에서는 다음을 설정하세요:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<강력한-랜덤-문자열>
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

### 배포 플랫폼

#### Railway.app (추천)

1. GitHub 저장소 연결
2. 환경 변수 설정
3. 자동 배포

#### Render.com

1. 새 Web Service 생성
2. 빌드 명령: `npm install && npm run build`
3. 시작 명령: `npm start`

---

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Socket.io 문서](https://socket.io/docs)
- [Mongoose 문서](https://mongoosejs.com/docs)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

---

**문의**: esjeong@apti.co.kr

