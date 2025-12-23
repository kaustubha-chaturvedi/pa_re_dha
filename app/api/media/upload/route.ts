import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { isDevelopment } from "@/lib/env"

export async function POST(req: NextRequest) {
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
        error: "R2 not configured. Please set CLOUDFLARE_R2_* environment variables."
      }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `media/${timestamp}-${sanitizedName}`

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    })

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    })

    await s3Client.send(command)

    return NextResponse.json({
      success: true,
      key,
      url: `${r2PublicUrl}/${key}`,
      name: file.name,
      size: file.size,
      contentType: file.type,
    })
  } catch (error: any) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to upload media"
    }, { status: 500 })
  }
}

