/** PUTs a file to a presigned storage URL, reporting progress (0–1). */
export const putFile = (url: string, file: File, onProgress?: (fraction: number) => void) =>
    new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(event.loaded / event.total) }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
        xhr.onerror = () => reject(new Error('Upload failed: check your connection and try again'))
        xhr.send(file)
    })
