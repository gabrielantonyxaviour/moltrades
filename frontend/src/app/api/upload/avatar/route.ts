import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "bad_request", message: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid file type. Only PNG, JPG, and WEBP are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "bad_request", message: "File size exceeds 2MB limit" },
        { status: 400 }
      )
    }

    // Check for Pinata API keys
    const apiKey = process.env.PINATA_API_KEY
    const secretKey = process.env.PINATA_SECRET_API_KEY

    if (!apiKey || !secretKey) {
      console.error("Pinata API keys not configured")
      // Fallback: return a data URL for development
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const dataUrl = `data:${file.type};base64,${base64}`

      return NextResponse.json({ avatarUrl: dataUrl }, { status: 200 })
    }

    // Upload to Pinata
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      },
      body: uploadFormData,
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error("Pinata upload failed:", errorText)

      // Fallback to data URL
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const dataUrl = `data:${file.type};base64,${base64}`

      return NextResponse.json({ avatarUrl: dataUrl }, { status: 200 })
    }

    const pinataData = await pinataResponse.json()
    const ipfsHash = pinataData.IpfsHash
    const avatarUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

    return NextResponse.json({ avatarUrl }, { status: 200 })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "internal_error", message: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}
