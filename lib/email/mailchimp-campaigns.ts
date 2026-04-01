'use server'

import { unstable_cache } from 'next/cache'

export interface MailchimpEilmeldung {
  id: string
  title: string
  subject: string
  sent_at: string
  archive_url: string
  emails_sent: number
}

const EILMELDUNG_FOLDER_ID = '54d12653ba'

/**
 * Fetch sent Eilmeldung campaigns from Mailchimp (cached 1h).
 * Only returns campaigns from 2026 onwards.
 */
export async function getCachedEilmeldungCampaigns(): Promise<MailchimpEilmeldung[]> {
  return unstable_cache(
    async () => {
      const apiKey = process.env.MAILCHIMP_API_KEY?.trim()
      if (!apiKey) return []

      const dc = apiKey.split('-').pop()?.trim()
      const baseUrl = `https://${dc}.api.mailchimp.com/3.0`
      const headers = {
        'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      }

      const campaigns: MailchimpEilmeldung[] = []
      let offset = 0
      const pageSize = 100

      while (true) {
        const url = `${baseUrl}/campaigns?folder_id=${EILMELDUNG_FOLDER_ID}&status=sent&count=${pageSize}&offset=${offset}&sort_field=send_time&sort_dir=DESC&since_send_time=2026-01-01T00:00:00Z`
        const res = await fetch(url, { headers })
        if (!res.ok) break

        const data = await res.json()
        const items = data.campaigns ?? []

        for (const c of items) {
          campaigns.push({
            id: c.id,
            title: c.settings?.title ?? '',
            subject: c.settings?.subject_line ?? '',
            sent_at: c.send_time ?? '',
            archive_url: c.archive_url ?? '',
            emails_sent: c.emails_sent ?? 0,
          })
        }

        if (items.length < pageSize) break
        offset += pageSize
      }

      return campaigns
    },
    ['mailchimp-eilmeldungen'],
    { revalidate: 3600 }
  )()
}
