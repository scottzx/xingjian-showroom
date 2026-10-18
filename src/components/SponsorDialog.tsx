import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface SponsorDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SponsorDialog({ isOpen, onClose }: SponsorDialogProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative z-[10000] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
            </p>
            <h2 className="text-2xl font-bold text-white">
              支持
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="关闭"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-white/70 text-center text-base">
            欢迎请作者喝杯咖啡 ☕
          </p>

          {/* QR Codes */}
          <div className="flex items-center justify-center gap-6">
            {/* Alipay */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 h-40 bg-white rounded-xl p-2 flex items-center justify-center">
                <img
                  src="/payment_images/alipay.JPG"
                  alt="支付宝支付码"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="flex flex-col items-center justify-center text-gray-400 text-sm p-4">
                        <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M9 10h.01M15 10h.01M12 14h.01M9 14h.01M15 14h.01" />
                        </svg>
                        <span>支付宝</span>
                      </div>
                    `
                  }}
                />
              </div>
              <span className="text-white/80 text-sm font-medium">支付宝</span>
            </div>

            {/* WeChat Pay */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 h-40 bg-white rounded-xl p-2 flex items-center justify-center">
                <img
                  src="/payment_images/wechat_pay.JPG"
                  alt="微信支付码"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="flex flex-col items-center justify-center text-gray-400 text-sm p-4">
                        <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M9 10h.01M15 10h.01M12 14h.01M9 14h.01M15 14h.01" />
                        </svg>
                        <span>微信支付</span>
                      </div>
                    `
                  }}
                />
              </div>
              <span className="text-white/80 text-sm font-medium">微信支付</span>
            </div>
          </div>

          {/* Thank you message */}
          <p className="text-white/50 text-center text-sm">
            感谢您的支持与鼓励 ❤️
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
