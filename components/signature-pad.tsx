"use client"

import { useRef, useState, useEffect, type MouseEvent, type TouchEvent } from "react"
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

interface SignaturePadProps {
  onSave: (signature: string) => void
  onClear: () => void
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Set canvas size on mount and resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        const scale = window.devicePixelRatio || 1
        
        // Set display size (css pixels)
        canvas.style.width = "100%"
        canvas.style.height = "200px"
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = parent.clientWidth * scale
        canvas.height = 200 * scale
        
        // Normalize coordinate system to use css pixels
        const ctx = canvas.getContext("2d")
        if (ctx) {
            ctx.scale(scale, scale)
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 2
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
        }
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    
    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  const getCoordinates = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as MouseEvent).clientX
      clientY = (e as MouseEvent).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const { x, y } = getCoordinates(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
        onSave(canvas.toDataURL('image/png'))
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const scale = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale)
    
    onClear()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-lg border-2 border-slate-300 overflow-hidden bg-white">
        <canvas
            ref={canvasRef}
            className="block touch-none cursor-crosshair"
            style={{ width: '100%', height: '200px' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-end">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="text-slate-500 hover:text-slate-700"
            type="button"
        >
            <Eraser className="mr-2 h-4 w-4" />
            Clear Signature
        </Button>
      </div>
    </div>
  )
}
