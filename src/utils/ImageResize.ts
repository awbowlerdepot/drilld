/**
 * Shrinks a large photo before upload: the long edge to at most `maxEdge`
 * pixels, saved as JPEG. Phone photos are often 4000+ pixels and several MB;
 * 2400 is still sharp for reading handwriting. PDFs and small images are
 * returned unchanged. Uses the browser's own decoder (createImageBitmap).
 */
export const shrinkImage = async (file: File, maxEdge = 2400, quality = 0.88): Promise<File> => {
    if (!file.type.startsWith('image/')) return file
    let bitmap: ImageBitmap
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        return file
    }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 3 * 1024 * 1024) {
        bitmap.close()
        return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified })
}
