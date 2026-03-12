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
import { TradeNotes } from './TradeNotes'
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
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? `Trade bearbeiten` : 'Neuer Trade'}</DialogTitle>
        </DialogHeader>
        <TradeForm trade={trade} onSuccess={() => setOpen(false)} />
        {trade && (
          <>
            <div className="border-t my-2" />
            <TradeNotes tradeFk={trade.id} notes={trade.notes ?? []} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
