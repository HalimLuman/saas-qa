import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage =
        nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth')

      if (isApiAuth) return true
      if (isAuthPage) return isLoggedIn ? Response.redirect(new URL('/dashboard', nextUrl)) : true
      return isLoggedIn
    },
  },
}
