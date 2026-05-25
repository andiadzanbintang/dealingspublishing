// src/components/ui/ImageUpload.jsx
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImageUpload({ value, onChange, className }) {
  const [preview, setPreview] = useState(value || null)
  const [objectUrl, setObjectUrl] = useState(null)
  const [error, setError] = useState('')

  // Keep preview synced when parent value changes.
  // This is important for edit pages where image URL is loaded from backend.
  useEffect(() => {
    if (value instanceof File) {
      const previewUrl = URL.createObjectURL(value)
      setPreview(previewUrl)
      setObjectUrl(previewUrl)
      return
    }

    setPreview(value || null)
  }, [value])

  // Cleanup temporary object URL to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError('')

      if (rejectedFiles?.length > 0) {
        const rejection = rejectedFiles[0]
        const code = rejection.errors?.[0]?.code

        if (code === 'file-too-large') {
          setError('Image size must be 5MB or less.')
        } else if (code === 'file-invalid-type') {
          setError('Only PNG, JPG, JPEG, and WEBP images are allowed.')
        } else {
          setError('Image upload failed. Please choose another file.')
        }

        return
      }

      const file = acceptedFiles[0]

      if (file) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }

        const previewUrl = URL.createObjectURL(file)
        setObjectUrl(previewUrl)
        setPreview(previewUrl)
        onChange(file) // Pass File object to parent form
      }
    },
    [onChange, objectUrl]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  const handleRemove = (e) => {
    e.stopPropagation()

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }

    setPreview(null)
    setError('')
    onChange(null)
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50',
          preview && 'border-solid border-neutral-200'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 bg-neutral-200 rounded-xl flex items-center justify-center mb-3">
              {isDragActive ? (
                <Upload className="w-5 h-5 text-primary-600" />
              ) : (
                <ImageIcon className="w-5 h-5 text-neutral-500" />
              )}
            </div>
            <p className="text-sm font-medium text-neutral-700">
              {isDragActive ? 'Drop image here' : 'Click or drag image to upload'}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              PNG, JPG, WEBP up to 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-danger-500">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}