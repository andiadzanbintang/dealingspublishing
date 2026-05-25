// src/components/ui/ConfirmDialog.jsx
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmText = 'Delete', variant = 'danger' }) {
  if (!open) return null

  const buttonStyles = {
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-danger-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            <p className="mt-2 text-sm text-neutral-500">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${buttonStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}