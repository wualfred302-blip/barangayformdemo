"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, RefreshCw, X, ZoomIn, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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
      <Card className="overflow-hidden rounded-[32px] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
        <CardContent className="px-6 pb-6 pt-0">
          {/* Green Banner */}
          <div className="relative h-20 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 -mx-6 -mt-0 mb-0 rounded-t-[32px] overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[url('/images/bagongpilipinas-logo-main.png')] bg-center bg-no-repeat opacity-5 bg-[length:150px]" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center gap-3 px-6">
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image
                  src="/images/bagongpilipinas-logo-main.png"
                  alt="Bagong Pilipinas"
                  fill
                  className="object-contain drop-shadow-lg"
                />
              </div>
              <h2 className="text-white font-black text-lg leading-tight">Official ID Card</h2>
            </div>
          </div>

          <div className="mt-5 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#111827]">Digital ID Card</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBackSide(!showBackSide)}
              className="rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold px-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Flip Card
            </Button>
          </div>
          
          {/* Portrait container - sized for rotated card display */}
          <div
            className="relative w-full mx-auto overflow-visible"
            style={{
              maxWidth: '320px',
              aspectRatio: '540 / 856'  // Portrait ratio (card height / card width when rotated)
            }}
          >
            {/* Rotation wrapper - rotates the landscape card to portrait */}
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: 'calc(856 / 540 * 100%)',  // Landscape width relative to portrait container
                aspectRatio: '856 / 540',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center'
              }}
            >
              {/* Perspective container - SEPARATE from rotation for proper 3D */}
              <div className="perspective-2000 w-full h-full">
                <motion.div
                  animate={{ rotateX: showBackSide ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  className="relative w-full h-full preserve-3d cursor-zoom-in group"
                  onClick={() => setIsZoomed(true)}
                >
                  {/* Front Side */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-50 shadow-xl border border-gray-200"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {frontImageUrl ? (
                      <Image
                        src={frontImageUrl}
                        alt={`Front of ID for ${fullName}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
                        <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center mb-2">
                          <RefreshCw className="h-6 w-6 animate-spin-slow opacity-20" />
                        </div>
                        <p className="text-sm font-bold opacity-60">Processing Front Side...</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
                  </div>

                  {/* Back Side */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-50 shadow-xl border border-gray-200"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                  >
                    {backImageUrl ? (
                      <Image
                        src={backImageUrl}
                        alt={`Back of ID for ${fullName}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
                        <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center mb-2">
                          <RefreshCw className="h-6 w-6 animate-spin-slow opacity-20" />
                        </div>
                        <p className="text-sm font-bold opacity-60">Processing Back Side...</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
                  </div>

                  <div className="absolute bottom-3 right-3 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ZoomIn className="h-4 w-4 text-gray-600" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2">
                <div className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-300",
                  !showBackSide ? "bg-emerald-500" : "bg-gray-200"
                )} />
                <div className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-300",
                  showBackSide ? "bg-emerald-500" : "bg-gray-200"
                )} />
             </div>

             {onDownload && (
                <Button
                  onClick={handleDownloadClick}
                  disabled={!isReady || isDownloading}
                  className={cn(
                    "w-full h-14 rounded-2xl text-lg font-bold transition-all duration-300",
                    isReady 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" 
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Downloading...
                    </span>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download Official ID
                    </>
                  )}
                </Button>
             )}
          </div>
        </CardContent>
      </Card>

      {/* Zoomed Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setIsZoomed(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 text-white hover:bg-white/10 rounded-full h-12 w-12"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-8 w-8" />
            </Button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex items-center justify-center"
              style={{
                width: 'min(90vw, 400px)',
                aspectRatio: '540 / 856'  // Portrait aspect ratio
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rotation wrapper for zoom modal */}
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: 'calc(856 / 540 * 100%)',
                  aspectRatio: '856 / 540',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center'
                }}
              >
                <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl bg-white">
                  {currentImage ? (
                    <Image
                      src={currentImage}
                      alt={imageAlt}
                      fill
                      className="object-contain"
                      quality={100}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white font-bold">
                      Image not ready
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="mt-8 text-center text-white">
              <h2 className="text-2xl font-black">{fullName}</h2>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="text-emerald-400 font-black tracking-widest">{qrtCode}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="text-white/60 font-bold uppercase tracking-widest text-xs">
                  {showBackSide ? "Back View" : "Front View"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
