import { checkAuth } from '@/lib/auth'
import { StartContent } from './start-content'

export default async function StartPage() {
  const isAuthed = await checkAuth()
  return <StartContent isAuthed={isAuthed} />
}
