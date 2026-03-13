import { checkAdmin } from '@/lib/auth'
import { AdminForm } from './admin-form'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const isAdmin = await checkAdmin()

  if (isAdmin) {
    redirect('/performance')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Admin-Login</h1>
          <p className="text-sm text-muted-foreground">
            Zugang zum Bearbeitungsmodus
          </p>
        </div>
        <AdminForm />
      </div>
    </div>
  )
}
