import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB for covers (larger than avatars)
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid file type. Only PNG, JPG, and WEBP are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "bad_request", message: "File size exceeds 4MB limit" },
        { status: 400 }
      )
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from("moltrades-covers")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase storage upload error:", error)
      return NextResponse.json(
        { error: "internal_error", message: "Failed to upload cover" },
        { status: 500 }
      )
    }

    const { data: publicUrl } = supabase.storage
      .from("moltrades-covers")
      .getPublicUrl(fileName)

    return NextResponse.json({ coverUrl: publicUrl.publicUrl }, { status: 200 })
  } catch (error) {
    console.error("Cover upload error:", error)
    return NextResponse.json(
      { error: "internal_error", message: "Failed to upload cover" },
      { status: 500 }
    )
  }
}
