import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{t('dialogs.unsavedChanges.title')}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white/70 mb-6">
            {t('dialogs.unsavedChanges.message')}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onSave}
              className="w-full px-4 py-3 bg-tesla-red hover:bg-tesla-red/80 text-white font-medium rounded-xl transition-colors"
            >
              {t('dialogs.unsavedChanges.save')}
            </button>
            <button
              onClick={onDiscard}
              className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
            >
              {t('dialogs.unsavedChanges.discard')}
            </button>
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 text-white/60 hover:text-white font-medium rounded-xl transition-colors"
            >
              {t('dialogs.unsavedChanges.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

