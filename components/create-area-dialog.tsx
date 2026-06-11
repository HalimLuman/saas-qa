'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export const AREA_COLORS = [
  '#52525b', // zinc
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#f97316', // orange
  '#06b6d4', // cyan
  '#64748b', // slate
] as const

interface Area {
  id: string
  name: string
  description?: string | null
  color: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  /** When provided, the dialog edits the existing area instead of creating one */
  editArea?: Area
  onSuccess?: (area: Area) => void
}

export default function CreateAreaDialog({ open, onOpenChange, projectId, editArea, onSuccess }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(AREA_COLORS[0])
  const [loading, setLoading] = useState(false)

  const isEdit = !!editArea

  useEffect(() => {
    if (open) {
      setName(editArea?.name ?? '')
      setDescription(editArea?.description ?? '')
      setColor(editArea?.color ?? AREA_COLORS[0])
    }
  }, [open, editArea])

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      let res: Response
      if (isEdit && editArea) {
        res = await fetch(`/api/areas/${editArea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
        })
      } else {
        res = await fetch(`/api/projects/${projectId}/areas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onOpenChange(false)
      onSuccess?.(data.area)
      toast.success(isEdit ? 'Area updated' : 'Area created')
      router.refresh()
    } catch (err: unknown) {
      toast.error('Error', { description: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Area' : 'New Area'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this area\'s name, description, or color.'
              : 'Areas let you organise tests and bugs into sections like "Sign In" or "Checkout".'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="area-name">Name</Label>
            <Input
              id="area-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sign In, Checkout, User Profile"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area-desc">
              Description{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="area-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this area cover?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full transition-all focus:outline-none"
                  style={{
                    background: c,
                    boxShadow: color === c
                      ? `0 0 0 2px white, 0 0 0 4px ${c}`
                      : undefined,
                    transform: color === c ? 'scale(1.15)' : undefined,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            style={{ background: color }}
          >
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Area')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
