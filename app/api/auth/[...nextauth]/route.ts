import NextAuth, { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(",").map(u => u.trim()) || []
      const githubProfile = profile as { login?: string } | undefined
      const username = githubProfile?.login || user.name
      
      if (!username || !allowedUsers.includes(username)) {
        return false
      }
      
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        // Extend session user type
        const user = session.user as typeof session.user & { id?: string }
        user.id = token.sub || ""
        // Add GitHub profile image if available
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    },
    async jwt({ token, account, profile }) {
      // Persist the GitHub profile image to the token
      const githubProfile = profile as { avatar_url?: string } | undefined
      if (githubProfile?.avatar_url) {
        token.picture = githubProfile.avatar_url
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

