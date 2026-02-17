'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TradeForm } from './TradeForm'
import type { Trade } from '@/lib/types'

interface TradeDialogProps {
  trade?: Trade
  trigger: React.ReactNode
}

export function TradeDialog({ trade, trigger }: TradeDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? `Trade bearbeiten` : 'Neuer Trade'}</DialogTitle>
        </DialogHeader>
        <TradeForm trade={trade} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
