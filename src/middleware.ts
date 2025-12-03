import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth

  // Define protected routes that require authentication
  const protectedPaths = ["/review", "/profile", "/saved"]
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
