/**
 * Authentication Service
 * Handles authentication and authorization checks
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '../app/api/auth/[...nextauth]/route'

const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * Check if user is authenticated and authorized
 * In production, requires valid session and allowed username
 * In development, optional (for easier local testing)
 */
export async function requireAuth(): Promise<{ session: any; username: string }> {
  const session = await getServerSession(authOptions)

  if (!isDevelopment) {
    if (!session) {
      throw new Error('Unauthorized')
    }

    const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(',').map((u) => u.trim()) || []
    const username = session.user?.name || session.user?.email || ''

    if (!username || !allowedUsers.includes(username)) {
      throw new Error('Forbidden')
    }

    return { session, username }
  }

  // In development, return session if available (optional)
  return { session: session || null, username: session?.user?.name || session?.user?.email || '' }
}

