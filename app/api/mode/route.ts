import { NextResponse } from "next/server"
import { isDevelopment, isProduction } from "@/lib/env"

/**
 * API endpoint to check if we're in development mode
 * Client-side code can use this to determine which API endpoints to use
 */
export async function GET() {
  return NextResponse.json({ 
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    nodeEnv: process.env.NODE_ENV,
    appEnv: process.env.APP_ENV || 'not set'
  })
}

