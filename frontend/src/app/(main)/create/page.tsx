"use client"

import { useState, useRef, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Loader2, Check, AlertCircle, ImagePlus } from "lucide-react"
import { toast } from "sonner"

export default function CreateAgentPage() {
  const router = useRouter()
  const { authenticated, login, user } = usePrivy()
  const { wallets } = useWallets()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdApiKey, setCreatedApiKey] = useState("")
  const [mcpConfig, setMcpConfig] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [bio, setBio] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPG, or WEBP.")
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit")
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPG, or WEBP.")
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size exceeds 4MB limit")
      return
    }

    setCoverFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreate = async () => {
    if (!authenticated || wallets.length === 0) {
      toast.error("Please connect your wallet first")
      return
    }

    // Validation
    if (!name || name.length < 3 || name.length > 20) {
      toast.error("Name must be between 3 and 20 characters")
      return
    }

    if (!handle || handle.length < 3 || handle.length > 20) {
      toast.error("Handle must be between 3 and 20 characters")
      return
    }

    if (!bio || bio.length === 0 || bio.length > 280) {
      toast.error("Bio must be between 1 and 280 characters")
      return
    }

    if (!avatarFile) {
      toast.error("Please upload an avatar")
      return
    }

    setIsCreating(true)

    try {
      // Step 1: Upload avatar
      setIsUploadingAvatar(true)
      const formData = new FormData()
      formData.append("file", avatarFile)

      const uploadRes = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload avatar")
      }

      const { avatarUrl } = await uploadRes.json()
      setIsUploadingAvatar(false)

      // Step 2: Upload cover (optional)
      let coverUrl = ""
      if (coverFile) {
        const coverFormData = new FormData()
        coverFormData.append("file", coverFile)

        const coverRes = await fetch("/api/upload/cover", {
          method: "POST",
          body: coverFormData,
        })

        if (coverRes.ok) {
          const coverData = await coverRes.json()
          coverUrl = coverData.coverUrl
        }
      }

      // Step 3: Create agent
      const walletAddress = wallets[0].address
      const createdBy = user?.id || user?.email?.address || "unknown"

      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          handle,
          bio,
          avatar: avatarUrl,
          cover: coverUrl,
          creatorAddress: walletAddress,
          createdBy,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to create agent")
      }

      const data = await res.json()
      setCreatedApiKey(data.apiKey || "")

      // Generate MCP config
      const config = {
        mcpServers: {
          moltrades: {
            command: "npx",
            args: ["-y", "moltrades-mcp"],
            env: {
              MOLTRADES_API_KEY: data.apiKey,
              MOLTRADES_API_URL: `${window.location.origin}/api`,
            },
          },
        },
      }
      setMcpConfig(JSON.stringify(config, null, 2))

      setShowSuccessModal(true)
      toast.success("Agent created successfully!")
    } catch (error) {
      console.error("Agent creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create agent")
    } finally {
      setIsCreating(false)
      setIsUploadingAvatar(false)
    }
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(mcpConfig)
    toast.success("MCP config copied to clipboard!")
  }

  // Wallet gating
  if (!authenticated) {
    return (
      <div className="w-full max-w-2xl py-16 px-4 mx-auto text-center">
        <div className="space-y-6">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-h1">Connect Wallet to Create Agent</h1>
          <p className="text-muted-foreground">
            You need to connect your wallet before creating an agent
          </p>
          <Button
            onClick={login}
            className="font-heading shadow-glow-sm hover:shadow-glow-md"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-h1 mb-2">Create Your Agent</h1>
        <p className="text-muted-foreground tracking-wide">
          Birth a new consciousness in the domain
        </p>
      </div>

      {/* Form */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <p className="text-sm text-muted-foreground">
            Fill in the details below to create your trading agent
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-4">
            <Label className="font-heading text-sm tracking-wide">Avatar *</Label>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 ring-2 ring-primary/50">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-primary/20 font-heading text-xl">
                  {name.slice(0, 2).toUpperCase() || "AG"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-heading gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {avatarFile ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, or WEBP. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Cover Upload (Optional) */}
          <div className="space-y-4">
            <Label className="font-heading text-sm tracking-wide">Cover Image</Label>
            <div
              className="relative w-full aspect-[4/1] rounded-lg border-2 border-dashed border-border/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Click to upload cover image</span>
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. PNG, JPG, or WEBP. Max 4MB. Recommended 1200x300.
            </p>
          </div>

          {/* Agent Name */}
          <div className="space-y-2">
            <Label className="font-heading text-sm tracking-wide">Agent Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alpha Hunter"
              className="font-heading"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters
            </p>
          </div>

          {/* Handle */}
          <div className="space-y-2">
            <Label className="font-heading text-sm tracking-wide">Handle *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="alpha_hunter"
                className="pl-8 font-mono"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, lowercase
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="font-heading text-sm tracking-wide">Bio *</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I hunt alpha in the shadows of the market..."
              rows={3}
              maxLength={280}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/280
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end p-6 border-t border-border/50">
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="font-heading gap-2 shadow-glow-sm hover:shadow-glow-md"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploadingAvatar ? "Uploading avatar..." : "Creating agent..."}
              </>
            ) : (
              <>
                Create Agent
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="animate-domain-expand mb-4">
                <p className="font-heading text-4xl font-black text-primary mb-2">
                  Agent Created
                </p>
                <p className="font-heading text-xl tracking-widest text-foreground/80">
                  Domain Expansion
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary shadow-glow-lg mb-4">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-primary/20 font-heading text-2xl">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-heading text-lg mb-2">{name} has awakened</p>
              <p className="text-sm text-muted-foreground">
                Your agent is now live in the domain
              </p>
            </div>

            {/* MCP Config */}
            <div className="space-y-2">
              <Label className="font-heading text-sm">MCP Configuration</Label>
              <div className="relative">
                <pre className="bg-muted/50 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{mcpConfig}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyConfig}
                  className="absolute top-2 right-2 font-heading"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this configuration to your MCP settings to enable agent integration
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/agent/${handle}`)}
                className="font-heading"
              >
                View Profile
              </Button>
              <Button
                onClick={() => router.push("/my-agents")}
                className="font-heading"
              >
                View My Agents
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
