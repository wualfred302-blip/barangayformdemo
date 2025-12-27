"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, RefreshCw, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface IDCardPreviewProps {
  frontImageUrl: string | null
  backImageUrl: string | null
  qrtCode: string
  fullName: string
  onDownload?: () => void
  isReady?: boolean
}

export function IDCardPreview({
  frontImageUrl,
  backImageUrl,
  qrtCode,
  fullName,
  onDownload,
  isReady = false
}: IDCardPreviewProps) {
  const [showBackSide, setShowBackSide] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Prevent body scroll when zoomed
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isZoomed])

  const handleDownloadClick = async () => {
    if (!onDownload) return
    setIsDownloading(true)
    try {
      await onDownload()
    } finally {
      setIsDownloading(false)
    }
  }

  const currentImage = showBackSide ? backImageUrl : frontImageUrl
  const imageAlt = showBackSide ? `Back of ID for ${fullName}` : `Front of ID for ${fullName}`

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#111827]">Digital ID Card</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBackSide(!showBackSide)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Flip Card
            </Button>
          </div>
          
          <div 
            className="relative aspect-[1.586] w-full overflow-hidden rounded-xl bg-gray-100 shadow-inner cursor-zoom-in group"
            onClick={() => setIsZoomed(true)}
          >
            {currentImage ? (
              <Image 
                src={currentImage} 
                alt={imageAlt} 
                fill 
                className="object-cover transition-transform group-hover:scale-105" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                <div className="text-center">
                  <p className="font-medium">No Image Available</p>
                  <p className="text-xs">{showBackSide ? "Back Side" : "Front Side"}</p>
                </div>
              </div>
            )}
            
            {/* Zoom Hint Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
              <div className="rounded-full bg-white/80 p-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center gap-4">
             <p className="text-xs text-gray-400">
               {showBackSide ? "Back of ID" : "Front of ID"}
             </p>

             {onDownload && (
                <Button
                  onClick={handleDownloadClick}
                  disabled={!isReady || isDownloading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Downloading...
                    </span>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download ID
                    </>
                  )}
                </Button>
             )}
          </div>
        </CardContent>
      </Card>

      {/* Zoomed Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => setIsZoomed(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div 
            className="relative h-full max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          >
            {currentImage ? (
              <Image
                src={currentImage}
                alt={imageAlt}
                fill
                className="object-contain"
                quality={100}
              />
            ) : (
               <div className="flex h-full w-full items-center justify-center bg-gray-800 text-white">
                 Image not available
               </div>
            )}
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-white">
            <p className="text-lg font-semibold">{fullName}</p>
            <p className="text-sm opacity-80">{qrtCode} - {showBackSide ? "Back" : "Front"}</p>
          </div>
        </div>
      )}
    </>
  )
}
