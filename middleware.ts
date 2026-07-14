// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'es', 'de', 'it', 'ar', 'ru'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files, API routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Check if the path has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If path has a locale, rewrite it
  if (pathnameHasLocale) {
    const locale = locales.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    
    if (locale) {
      const newPathname = pathname.replace(`/${locale}`, '') || '/';
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.rewrite(url);
    }
  }

  // If path is /en, remove /en and redirect
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const newPathname = pathname.replace('/en', '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = newPathname;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};