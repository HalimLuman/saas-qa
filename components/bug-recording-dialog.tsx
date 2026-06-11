'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, Square, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export interface BugRecordingResult {
  title: string
  stepsToReproduce: string[]
  actualBehavior: string
  thumbnail: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onResult: (result: BugRecordingResult) => void
}

type Phase = 'idle' | 'recording' | 'analyzing' | 'error'

const FRAME_INTERVAL_MS = 2000
const MAX_FRAMES = 16
const FRAME_WIDTH = 1280
const THUMB_WIDTH = 320

export default function BugRecordingDialog({ open, onOpenChange, projectId, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [context, setContext] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [frameCount, setFrameCount] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    canvasRef.current = document.createElement('canvas')
    thumbCanvasRef.current = document.createElement('canvas')
    videoElRef.current = document.createElement('video')
    videoElRef.current.muted = true
    videoElRef.current.playsInline = true
  }, [])

  function captureFrame() {
    const video = videoElRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const scale = Math.min(1, FRAME_WIDTH / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const b64 = canvas.toDataURL('image/jpeg', 0.75).replace(/^data:image\/jpeg;base64,/, '')
    framesRef.current.push(b64)
    setFrameCount(framesRef.current.length)

    if (framesRef.current.length >= MAX_FRAMES) stopAndAnalyze()
  }

  function makeThumbnail(): string {
    const video = videoElRef.current
    const canvas = thumbCanvasRef.current
    if (!video || !canvas) return ''
    const scale = THUMB_WIDTH / video.videoWidth
    canvas.width = THUMB_WIDTH
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.65)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      })
      streamRef.current = stream
      framesRef.current = []
      setFrameCount(0)

      const video = videoElRef.current!
      video.srcObject = stream
      await video.play()

      captureFrame()
      intervalRef.current = setInterval(captureFrame, FRAME_INTERVAL_MS)
      stream.getVideoTracks()[0].addEventListener('ended', stopAndAnalyze)
      setPhase('recording')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/denied|cancel|abort|notallowed/i.test(msg)) return
      setErrorMsg('Could not start screen capture. Please allow screen sharing when prompted.')
      setPhase('error')
    }
  }

  function stopAndAnalyze() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const thumb = makeThumbnail()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const video = videoElRef.current
    if (video) video.srcObject = null

    setPhase('analyzing')
    sendFrames(thumb)
  }

  async function sendFrames(thumbnail: string) {
    const frames = framesRef.current
    if (frames.length === 0) {
      setErrorMsg('No frames captured. The recording may have been too short.')
      setPhase('error')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/bugs/analyze-recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, context: context.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Analysis failed')
      }

      const { result } = await res.json()
      onResult({
        title: result.title ?? '',
        stepsToReproduce: Array.isArray(result.stepsToReproduce) ? result.stepsToReproduce : [],
        actualBehavior: result.actualBehavior ?? '',
        thumbnail,
      })
      onOpenChange(false)
      toast.success('Recording analyzed', { description: 'Steps and actual behavior filled in from your recording.' })
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed')
      setPhase('error')
    }
  }

  function reset() {
    framesRef.current = []
    setFrameCount(0)
    setPhase('idle')
    setErrorMsg('')
  }

  function handleClose(v: boolean) {
    if (phase === 'recording') stopAndAnalyze()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onOpenChange(v)
    if (!v) setTimeout(reset, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-4 w-4 text-rose-500" />
            Record Bug
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {phase === 'idle' && (
            <>
              <p className="text-sm text-slate-600">
                Share your screen and reproduce the bug. AI will watch the recording and automatically fill in the reproduction steps and actual behavior.
              </p>
              <p className="text-xs text-slate-400">
                Captures 1 snapshot every 2 s — up to {MAX_FRAMES} snapshots (~{(MAX_FRAMES - 1) * FRAME_INTERVAL_MS / 1000} s max).
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="bug-rec-context">Context <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  id="bug-rec-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Checkout flow on mobile, Safari 17"
                  maxLength={500}
                />
              </div>
              <Button className="w-full gap-2" variant="destructive" onClick={startRecording}>
                <Video className="h-4 w-4" />
                Start Recording
              </Button>
            </>
          )}

          {phase === 'recording' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50">
                <span className="h-3.5 w-3.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Recording in progress</p>
                <p className="text-sm text-slate-500 mt-1">Reproduce the bug, then click stop.</p>
                <div className="mt-3 space-y-1.5 px-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{frameCount} / {MAX_FRAMES} snapshots</span>
                    {frameCount >= MAX_FRAMES && (
                      <span className="text-amber-600 font-medium">Limit reached — analyzing…</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        frameCount >= MAX_FRAMES
                          ? 'bg-red-400'
                          : frameCount >= MAX_FRAMES * 0.75
                          ? 'bg-amber-400'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, (frameCount / MAX_FRAMES) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <Button variant="destructive" className="gap-2" onClick={stopAndAnalyze}>
                <Square className="h-4 w-4 fill-current" />
                Stop &amp; Analyze
              </Button>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="text-center space-y-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
              <p className="font-semibold text-slate-900">Analyzing {frameCount} snapshots…</p>
              <p className="text-sm text-slate-500">AI is extracting reproduction steps</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="space-y-4">
              <div className="flex gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={reset}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
