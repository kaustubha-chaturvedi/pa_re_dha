/**
 * Authentication Service
 * Handles authentication and authorization checks
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '../app/api/auth/[...nextauth]/route'
import { isDevelopment } from './env'

/**
 * Check if user is authenticated and authorized
 * In production, requires valid session and allowed username
 * In development, optional (for easier local testing)
 */
export async function requireAuth(): Promise<{ session: any; username: string }> {
  const session = await getServerSession(authOptions)

  if (!isDevelopment()) {
    if (!session) {
      console.error('[requireAuth] No session found')
      throw new Error('Unauthorized')
    }

    const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(',').map((u) => u.trim()) || []
    // Try to get GitHub username from session (stored during OAuth)
    const user = session.user as typeof session.user & { githubUsername?: string }
    const githubUsername = user?.githubUsername
    // Fallback to name/email if GitHub username not available
    const username = githubUsername || session.user?.name || session.user?.email || ''

    console.log('[requireAuth] Checking authorization:', {
      githubUsername,
      username,
      allowedUsers,
      userInList: allowedUsers.includes(username)
    })

    if (!username || !allowedUsers.includes(username)) {
      console.error('[requireAuth] User not authorized:', {
        githubUsername,
        username,
        allowedUsers,
        sessionUser: session.user
      })
      throw new Error('Forbidden')
    }

    return { session, username }
  }

  // In development, return session if available (optional)
  return { session: session || null, username: session?.user?.name || session?.user?.email || '' }
}

