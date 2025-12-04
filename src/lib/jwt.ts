import jwt, { SignOptions } from 'jsonwebtoken'
import { IUser } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  username: string
}

/**
 * JWT 토큰 생성
 */
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

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * JWT 토큰 디코딩 (검증 없이)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

