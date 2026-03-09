'use client'

import { useEffect, useState } from 'react'
import { getYouTubeData, type YouTubeData, type VideoStats, type CommentThread } from '@/lib/youtube-actions'

type DateRangeValue = 14 | 60 | null

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })
}

function formatDayShort(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit',
  })
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '–'
  const h = Number(m[1] || 0)
  const min = Number(m[2] || 0)
  const sec = Number(m[3] || 0)
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${min}:${String(sec).padStart(2, '0')}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('de-DE')
}

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="intern__section intern__section--collapsible">
      <button className="intern__section-toggle" onClick={() => setOpen(!open)}>
        <h2>{title}</h2>
        <span className={`intern__chevron ${open ? 'intern__chevron--open' : ''}`}>&#9662;</span>
      </button>
      {open && <div className="intern__section-body">{children}</div>}
    </section>
  )
}

export function YouTubeDashboard() {
  const [data, setData] = useState<YouTubeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeValue>(14)
  const [activeTab, setActiveTab] = useState<'videos' | 'kommentare'>('videos')
  const [videoFilter, setVideoFilter] = useState<'alle' | 'long' | 'shorts'>('alle')

  useEffect(() => {
    getYouTubeData().then(result => {
      if ('error' in result) setError(result.error ?? null)
      if ('data' in result && result.data) setData(result.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#5a6a7a' }}>YouTube-Daten werden geladen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ff5050', marginBottom: 8 }}>{error}</p>
          <p style={{ color: '#5a6a7a', fontSize: '0.85rem' }}>
            Stelle sicher, dass YOUTUBE_API_KEY und YOUTUBE_CHANNEL_ID in .env gesetzt sind.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const rangeOptions: { label: string; value: DateRangeValue }[] = [
    { label: '2W', value: 14 },
    { label: '2M', value: 60 },
    { label: 'Alle', value: null },
  ]

  // Filter videos by date range
  const now = new Date()
  const filterByRange = (videos: VideoStats[]) => {
    if (dateRange === null) return videos
    const cutoff = new Date(now.getTime() - dateRange * 86400000)
    return videos.filter(v => new Date(v.publishedAt) >= cutoff)
  }

  const filterByType = (videos: VideoStats[]) => {
    if (videoFilter === 'shorts') return videos.filter(v => v.isShort)
    if (videoFilter === 'long') return videos.filter(v => !v.isShort)
    return videos
  }

  const filteredVideos = filterByType(filterByRange(data.videos))
  const rangeVideos = filterByRange(data.videos)

  // Aggregate stats
  const totalViews = filteredVideos.reduce((s, v) => s + v.viewCount, 0)
  const totalLikes = filteredVideos.reduce((s, v) => s + v.likeCount, 0)
  const totalComments = filteredVideos.reduce((s, v) => s + v.commentCount, 0)
  const avgViews = filteredVideos.length > 0 ? Math.round(totalViews / filteredVideos.length) : 0

  // Chart data: views per video (sorted by date, oldest first)
  const chartVideos = [...filteredVideos].reverse().slice(-20) // max 20 bars
  const maxViews = Math.max(...chartVideos.map(v => v.viewCount), 1)

  // Comments filtered by date range
  const filteredComments = dateRange === null
    ? data.comments
    : data.comments.filter(c => new Date(c.publishedAt) >= new Date(now.getTime() - dateRange * 86400000))

  // Group comments by video
  const commentsByVideo = filteredComments.reduce<Record<string, { title: string; comments: CommentThread[] }>>((acc, c) => {
    if (!acc[c.videoId]) acc[c.videoId] = { title: c.videoTitle, comments: [] }
    acc[c.videoId].comments.push(c)
    return acc
  }, {})

  // Top keywords (top 30)
  const topKeywords = Object.entries(data.keywordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)

  return (
    <div className="intern">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__label">Abonnenten</div>
          <div className="kpi-card__value">{formatNumber(data.channel.subscriberCount)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Aufrufe Gesamt</div>
          <div className="kpi-card__value">{formatNumber(data.channel.viewCount)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Videos</div>
          <div className="kpi-card__value">{data.channel.videoCount}</div>
          <div className="kpi-card__sub">
            {data.videos.filter(v => !v.isShort).length} Long / {data.videos.filter(v => v.isShort).length} Shorts
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">&Oslash; Aufrufe/Video</div>
          <div className="kpi-card__value">{formatNumber(avgViews)}</div>
          <div className="kpi-card__sub">
            {filteredVideos.length} Videos im Zeitraum
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="range-filter">
        {rangeOptions.map(opt => (
          <button
            key={opt.label}
            className={`range-filter__btn ${dateRange === opt.value ? 'range-filter__btn--active' : ''}`}
            onClick={() => setDateRange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['alle', 'long', 'shorts'] as const).map(f => (
            <button
              key={f}
              className={`range-filter__btn ${videoFilter === f ? 'range-filter__btn--active' : ''}`}
              onClick={() => setVideoFilter(f)}
            >
              {f === 'alle' ? 'Alle' : f === 'long' ? 'Long-Form' : 'Shorts'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="yt-summary">
        <span>{formatNumber(totalViews)} Aufrufe</span>
        <span>{formatNumber(totalLikes)} Likes</span>
        <span>{formatNumber(totalComments)} Kommentare</span>
        <span>{filteredVideos.length} Videos</span>
      </div>

      {/* Views per Video Chart */}
      <section className="intern__section">
        <div className="intern__section-header">
          <h2>Aufrufe pro Video</h2>
        </div>
        <div className="bar-chart">
          {chartVideos.map(v => (
            <div key={v.videoId} className="bar-chart__col">
              <div className="bar-chart__count">{v.viewCount > 999 ? `${(v.viewCount / 1000).toFixed(1)}k` : v.viewCount}</div>
              <div className="bar-chart__stack">
                <div
                  className={`bar-chart__layer ${v.isShort ? 'bar-chart__layer--yt-short' : 'bar-chart__layer--yt-long'}`}
                  style={{ height: `${(v.viewCount / maxViews) * 100}%` }}
                />
              </div>
              <div className="bar-chart__label" title={v.title}>
                {formatDayShort(v.publishedAt)}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend" style={{ marginTop: 12 }}>
          <span className="chart-legend__item chart-legend__item--yt-long">Long-Form</span>
          <span className="chart-legend__item chart-legend__item--yt-short">Shorts</span>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="detail-tabs">
        {([
          { key: 'videos' as const, label: 'Videos' },
          { key: 'kommentare' as const, label: 'Kommentare' },
        ]).map(tab => (
          <button
            key={tab.key}
            className={`detail-tabs__btn ${activeTab === tab.key ? 'detail-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Videos */}
      {activeTab === 'videos' && (
        <div className="detail-tab-content">
          <CollapsibleSection title="Aktuelle Videos">
            <table className="intern-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Typ</th>
                  <th>Datum</th>
                  <th>Aufrufe</th>
                  <th>Likes</th>
                  <th>Kommentare</th>
                  <th>Dauer</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map(v => (
                  <tr key={v.videoId}>
                    <td>
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yt-video-title"
                        title={v.title}
                      >
                        {v.title}
                      </a>
                    </td>
                    <td>
                      <span className={`yt-type-badge ${v.isShort ? 'yt-type-badge--short' : 'yt-type-badge--long'}`}>
                        {v.isShort ? 'Short' : 'Long'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDay(v.publishedAt)}</td>
                    <td>{formatNumber(v.viewCount)}</td>
                    <td>{formatNumber(v.likeCount)}</td>
                    <td>{v.commentCount}</td>
                    <td>{formatDuration(v.duration)}</td>
                  </tr>
                ))}
                {filteredVideos.length === 0 && (
                  <tr><td colSpan={7}>Keine Videos im gewählten Zeitraum</td></tr>
                )}
              </tbody>
            </table>
          </CollapsibleSection>
        </div>
      )}

      {/* Tab: Kommentare */}
      {activeTab === 'kommentare' && (
        <div className="detail-tab-content">
          <CollapsibleSection title="Top Keywords">
            <div className="yt-keywords">
              {topKeywords.map(([word, count]) => (
                <span key={word} className="yt-keyword-tag">
                  {word} <span className="yt-keyword-count">{count}</span>
                </span>
              ))}
              {topKeywords.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Keine Kommentare vorhanden</p>
              )}
            </div>
          </CollapsibleSection>

          {Object.entries(commentsByVideo).map(([videoId, group]) => (
            <CollapsibleSection key={videoId} title={group.title} defaultOpen={false}>
              {group.comments
                .sort((a, b) => b.likeCount - a.likeCount)
                .map(c => (
                  <div key={c.commentId} className="yt-comment">
                    <div className="yt-comment__header">
                      <span className="yt-comment__author">{c.authorName}</span>
                      <span className="yt-comment__date">{formatDay(c.publishedAt)}</span>
                      {c.likeCount > 0 && (
                        <span className="yt-comment__likes">{c.likeCount} &#x1f44d;</span>
                      )}
                    </div>
                    <div className="yt-comment__text" dangerouslySetInnerHTML={{ __html: c.text }} />
                    {c.replyCount > 0 && (
                      <div className="yt-comment__meta">{c.replyCount} Antworten</div>
                    )}
                  </div>
                ))}
            </CollapsibleSection>
          ))}

          {Object.keys(commentsByVideo).length === 0 && (
            <section className="intern__section">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: 20, textAlign: 'center' }}>
                Keine Kommentare im gewählten Zeitraum
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
