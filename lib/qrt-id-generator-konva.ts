import Konva from 'konva'

export interface GenerateQRTIDResult {
  success: boolean
  frontImageUrl?: string
  backImageUrl?: string
  error?: string
}

export async function generateQRTIDImagesKonva(
  frontStage: Konva.Stage | null,
  backStage: Konva.Stage | null
): Promise<GenerateQRTIDResult> {
  console.log('[Konva Generator] Starting ID generation...')
  console.log('[Konva Generator] Front Stage:', frontStage ? 'Ready' : 'NULL')
  console.log('[Konva Generator] Back Stage:', backStage ? 'Ready' : 'NULL')

  try {
    if (!frontStage || !backStage) {
      const error = 'Stage references are not available'
      console.error('[Konva Generator] ERROR:', error)
      return {
        success: false,
        error,
      }
    }

    // Wait a brief moment to ensure all images are loaded
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log('[Konva Generator] Generating front image...')
    const frontImageUrl = frontStage.toDataURL({
      mimeType: 'image/png',
      pixelRatio: 2, // High quality export
    })
    console.log('[Konva Generator] Front image generated:', frontImageUrl ? `${frontImageUrl.substring(0, 50)}...` : 'EMPTY')

    console.log('[Konva Generator] Generating back image...')
    const backImageUrl = backStage.toDataURL({
      mimeType: 'image/png',
      pixelRatio: 2, // High quality export
    })
    console.log('[Konva Generator] Back image generated:', backImageUrl ? `${backImageUrl.substring(0, 50)}...` : 'EMPTY')

    if (!frontImageUrl || !backImageUrl) {
      const error = 'Failed to generate image data URLs'
      console.error('[Konva Generator] ERROR:', error)
      return {
        success: false,
        error,
      }
    }

    console.log('[Konva Generator] SUCCESS - Both images generated')
    return {
      success: true,
      frontImageUrl,
      backImageUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Konva Generator] EXCEPTION:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Downloads an image data URL as a file
 * @param dataUrl - The image data URL
 * @param filename - The filename to save as
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
