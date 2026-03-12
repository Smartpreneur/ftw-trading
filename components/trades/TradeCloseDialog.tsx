'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TradeCloseForm } from './TradeCloseForm'
import type { TradeClose } from '@/lib/types'

interface TradeCloseDialogProps {
  tradeFk: string
  close: TradeClose
  trigger: React.ReactNode
}

export function TradeCloseDialog({ tradeFk, close, trigger }: TradeCloseDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Schließung bearbeiten</DialogTitle>
        </DialogHeader>
        <TradeCloseForm
          tradeFk={tradeFk}
          close={close}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
