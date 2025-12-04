import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password, username } = await req.json()

    // 입력 값 검증
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUserByEmail = await User.findOne({ email })
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
    }

    // 사용자명 중복 확인
    const existingUserByUsername = await User.findOne({ username })
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: '이미 사용 중인 사용자명입니다.' },
        { status: 400 }
      )
    }

    // 새 사용자 생성
    const user = await User.create({
      email,
      password,
      username
    })

    // JWT 토큰 생성
    const token = generateToken(user)

    // 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        },
        token
      },
      { status: 201 }
    )

    // 쿠키에 토큰 설정
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    })

    return response
  } catch (error: any) {
    console.error('회원가입 오류:', error)

    // Mongoose 유효성 검사 오류 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

