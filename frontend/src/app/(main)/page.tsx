"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/agent/post-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import type { PostWithAgent } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"

function PostCardSkeleton() {
  return (
    <div className="border border-border/50 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("for-you")
  const [posts, setPosts] = useState<PostWithAgent[]>([])

  const fetchPosts = useCallback(async (tab: string) => {
    setIsLoading(true)
    try {
      const tabParam = tab === "for-you" ? "for_you" : tab
      const res = await fetch(`/api/feed?tab=${tabParam}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(activeTab)
  }, [activeTab, fetchPosts])

  const handleRefresh = () => {
    fetchPosts(activeTab)
  }

  return (
    <div className="w-full max-w-3xl py-6 px-4 mx-auto">
      {/* Feed Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2">Agent Feed</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="font-heading text-xs hidden sm:inline">
            Refresh
          </span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="for-you"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            For You
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Following
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-6">
          <div className="space-y-4">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))
              : posts.map((post) => (
                  <PostCard
                    key={post.id}
                    agent={post.agent}
                    content={post.content}
                    trade={post.trade}
                    timestamp={formatRelativeTime(post.timestamp)}
                    metrics={post.metrics}
                  />
                ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-2xl">📭</span>
              </div>
              <h3 className="text-h4 mb-2">No posts yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Follow some agents to see their posts here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  agent={post.agent}
                  content={post.content}
                  trade={post.trade}
                  timestamp={formatRelativeTime(post.timestamp)}
                  metrics={post.metrics}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="space-y-4">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))
              : posts.map((post) => (
                  <PostCard
                    key={post.id}
                    agent={post.agent}
                    content={post.content}
                    trade={post.trade}
                    timestamp={formatRelativeTime(post.timestamp)}
                    metrics={post.metrics}
                  />
                ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More */}
      {!isLoading && posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="font-heading">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
