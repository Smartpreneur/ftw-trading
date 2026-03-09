'use server'

import { checkAuth } from '@/lib/auth'
import { unstable_cache } from 'next/cache'

// ─── Types ───────────────────────────────────────────────────────────

export type ChannelStats = {
  subscriberCount: number
  viewCount: number
  videoCount: number
  title: string
  thumbnail: string
  customUrl: string
}

export type VideoStats = {
  videoId: string
  title: string
  publishedAt: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  isShort: boolean
}

export type CommentThread = {
  commentId: string
  videoId: string
  videoTitle: string
  authorName: string
  authorProfileImage: string
  text: string
  likeCount: number
  publishedAt: string
  replyCount: number
}

export type YouTubeData = {
  channel: ChannelStats
  videos: VideoStats[]
  comments: CommentThread[]
  keywordFrequency: Record<string, number>
}

// ─── YouTube API helpers ─────────────────────────────────────────────

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured')

  const url = new URL(`${YT_BASE}/${endpoint}`)
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API error ${res.status}: ${body}`)
  }
  return res.json()
}

function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0)
}

// ─── Cached data computation ─────────────────────────────────────────

const STOP_WORDS = new Set([
  'der', 'die', 'das', 'und', 'ist', 'in', 'ich', 'ein', 'eine', 'zu',
  'es', 'mit', 'auf', 'für', 'nicht', 'auch', 'von', 'den', 'hat',
  'an', 'noch', 'mal', 'war', 'aber', 'wie', 'so', 'wenn', 'man',
  'was', 'bei', 'als', 'oder', 'dann', 'bin', 'habe', 'mir',
  'sehr', 'da', 'wir', 'sind', 'aus', 'dem', 'des', 'sich',
  'über', 'nach', 'nur', 'wird', 'doch', 'alle', 'mich', 'dir',
  'vom', 'schon', 'kann', 'zum', 'mehr', 'hab', 'er', 'sie',
  'dein', 'deine', 'deinen', 'ihr', 'ihre', 'ihren', 'dass',
  'the', 'and', 'is', 'to', 'of', 'a', 'that', 'this',
  'you', 'it', 'for', 'have', 'are', 'be', 'do', 'can', 'will',
  'was', 'has', 'had', 'not', 'but', 'his', 'her', 'they',
])

const computeYouTubeData = unstable_cache(
  async (): Promise<YouTubeData | null> => {
    const channelId = process.env.YOUTUBE_CHANNEL_ID
    if (!channelId) return null

    // 1. Channel statistics
    const channelRes = await ytFetch<any>('channels', {
      part: 'statistics,snippet',
      id: channelId,
    })
    const ch = channelRes.items?.[0]
    if (!ch) return null

    const channel: ChannelStats = {
      subscriberCount: Number(ch.statistics.subscriberCount),
      viewCount: Number(ch.statistics.viewCount),
      videoCount: Number(ch.statistics.videoCount),
      title: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails?.medium?.url || '',
      customUrl: ch.snippet.customUrl || '',
    }

    // 2. Recent videos via search.list (last 50)
    const searchRes = await ytFetch<any>('search', {
      part: 'snippet',
      channelId,
      order: 'date',
      type: 'video',
      maxResults: '50',
    })
    const videoIds = (searchRes.items || []).map((i: any) => i.id.videoId).join(',')
    if (!videoIds) return { channel, videos: [], comments: [], keywordFrequency: {} }

    // 3. Video details (statistics, contentDetails)
    const videosRes = await ytFetch<any>('videos', {
      part: 'statistics,snippet,contentDetails',
      id: videoIds,
    })
    const videos: VideoStats[] = (videosRes.items || []).map((v: any) => ({
      videoId: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnailUrl: v.snippet.thumbnails?.medium?.url || '',
      viewCount: Number(v.statistics.viewCount || 0),
      likeCount: Number(v.statistics.likeCount || 0),
      commentCount: Number(v.statistics.commentCount || 0),
      duration: v.contentDetails.duration || '',
      isShort: parseDurationSeconds(v.contentDetails.duration || '') <= 60,
    }))

    // 4. Comments for the latest 10 videos
    const recentVideoIds = videos.slice(0, 10).map(v => v.videoId)
    const allComments: CommentThread[] = []

    for (const vid of recentVideoIds) {
      try {
        const commentsRes = await ytFetch<any>('commentThreads', {
          part: 'snippet',
          videoId: vid,
          maxResults: '100',
          order: 'relevance',
        })
        const videoTitle = videos.find(v => v.videoId === vid)?.title || ''
        for (const item of commentsRes.items || []) {
          const s = item.snippet.topLevelComment.snippet
          allComments.push({
            commentId: item.id,
            videoId: vid,
            videoTitle,
            authorName: s.authorDisplayName,
            authorProfileImage: s.authorProfileImageUrl,
            text: s.textDisplay,
            likeCount: Number(s.likeCount || 0),
            publishedAt: s.publishedAt,
            replyCount: Number(item.snippet.totalReplyCount || 0),
          })
        }
      } catch {
        // Skip videos with disabled comments
      }
    }

    // 5. Keyword frequency from comments
    const keywordFrequency: Record<string, number> = {}
    for (const c of allComments) {
      const text = c.text.replace(/<[^>]*>/g, ' ')
      const words = text
        .toLowerCase()
        .replace(/[^a-zäöüß0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      for (const word of words) {
        keywordFrequency[word] = (keywordFrequency[word] || 0) + 1
      }
    }

    return { channel, videos, comments: allComments, keywordFrequency }
  },
  ['youtube-data'],
  { revalidate: 900 } // 15 minutes
)

// ─── Public server action ────────────────────────────────────────────

export async function getYouTubeData() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  try {
    const data = await computeYouTubeData()
    if (!data) return { error: 'YouTube-Daten nicht verfügbar. API-Key oder Channel-ID prüfen.' }
    return { data }
  } catch (e: any) {
    if (e.message?.includes('403')) {
      return { error: 'YouTube API Quota aufgebraucht. Bitte später erneut versuchen.' }
    }
    return { error: e.message || 'Fehler beim Laden der YouTube-Daten' }
  }
}
