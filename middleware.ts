import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
}
