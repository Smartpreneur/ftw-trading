import { redirect } from 'next/navigation'

// /landing wurde auf / verschoben. Redirect für Rückwärtskompatibilität.
// Query-Parameter (z.B. ?ref=y26) werden von next.config.ts automatisch weitergeleitet.
export default function LandingRedirect() {
  redirect('/')
}
