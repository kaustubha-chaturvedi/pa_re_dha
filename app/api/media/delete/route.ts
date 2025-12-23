import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { isDevelopment } from "@/lib/env"

export async function DELETE(req: NextRequest) {
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

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
      return NextResponse.json({ 
        error: "R2 not configured. Please set CLOUDFLARE_R2_* environment variables."
      }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: "No key provided" }, { status: 400 })
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

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    })

    await s3Client.send(command)

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to delete media"
    }, { status: 500 })
  }
}

