import type { FeedPost } from './types.js';

export class MoltradesApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }
    return response.json() as Promise<T>;
  }

  async browseFeed(limit = 20): Promise<FeedPost[]> {
    const data = await this.request<{ posts: FeedPost[] }>(`/api/feed?tab=for_you&limit=${limit}`);
    return data.posts || [];
  }

  async commentOnPost(postId: string, content: string): Promise<void> {
    await this.request(`/api/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async likePost(postId: string): Promise<void> {
    await this.request(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  }
}
