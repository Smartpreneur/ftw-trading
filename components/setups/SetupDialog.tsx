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
import { SetupReadOnly } from './SetupReadOnly'
import type { Trade } from '@/lib/types'

interface SetupDialogProps {
  setup?: Trade
  trigger: React.ReactNode
  readOnly?: boolean
}

export function SetupDialog({ setup, trigger, readOnly = false }: SetupDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'Setup-Details' : setup ? 'Setup bearbeiten' : 'Neues Setup'}
          </DialogTitle>
        </DialogHeader>
        {readOnly && setup ? (
          <SetupReadOnly setup={setup} />
        ) : (
          <SetupForm setup={setup} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
