import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai — không cần đăng nhập
const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

// Các route chỉ dành cho người CHƯA đăng nhập (auth pages)
const AUTH_ONLY_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua static files và API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Kiểm tra token từ cookie. Nếu access token hết hạn nhưng refresh token còn,
  // cho client vào app để AuthProvider refresh thay vì đá về login khi reload.
  const authToken = request.cookies.get('auth_token');
  const refreshToken = request.cookies.get('refresh_token');
  const isAuthenticated = !!authToken?.value || !!refreshToken?.value;

  // Nếu đã đăng nhập mà vào trang auth → redirect về feed
  if (isAuthenticated && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Nếu chưa đăng nhập mà vào trang cần auth → redirect về login
  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname) && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};