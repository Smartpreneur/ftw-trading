'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SetupForm } from './SetupForm'
import type { TradeSetup } from '@/lib/types'

interface SetupDialogProps {
  setup?: TradeSetup
  trigger: React.ReactNode
}

export function SetupDialog({ setup, trigger }: SetupDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[90rem] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{setup ? 'Setup bearbeiten' : 'Neues Setup'}</DialogTitle>
        </DialogHeader>
        <SetupForm setup={setup} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
