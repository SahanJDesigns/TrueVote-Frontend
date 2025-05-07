// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('wallet_address')?.value

  const isAuth = !!token
  const isDashboard = request.nextUrl.pathname.startsWith('/campaigns')

  if (isDashboard && !isAuth) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Apply only to specific routes
export const config = {
  matcher: ['/campaigns/:path*'],
}
