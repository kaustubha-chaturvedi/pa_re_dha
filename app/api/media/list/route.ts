import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { isDevelopment } from "@/lib/env"

export async function GET(req: NextRequest) {
  // Skip auth in development
  if (!isDevelopment()) {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    // Check if R2 is configured
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) {
      return NextResponse.json({ 
        media: [],
        configured: false,
        message: "R2 not configured. Please set CLOUDFLARE_R2_* environment variables."
      })
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    })

    // List objects
    const command = new ListObjectsV2Command({
      Bucket: r2BucketName,
      Prefix: "media/",
    })

    const response = await s3Client.send(command)

    // Format response
    const media = (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      url: `${r2PublicUrl}/${obj.Key}`,
      size: obj.Size || 0,
      contentType: 'image/jpeg', // R2 doesn't return content type in list, would need HEAD request
      uploaded: obj.LastModified?.toISOString() || new Date().toISOString(),
      name: obj.Key?.split('/').pop() || obj.Key || '',
    }))

    return NextResponse.json({ 
      media,
      configured: true,
    })
  } catch (error: any) {
    console.error("Error listing media:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to list media",
      media: [],
      configured: false,
    }, { status: 500 })
  }
}

