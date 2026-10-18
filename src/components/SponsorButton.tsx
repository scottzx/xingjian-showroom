import { useState } from 'react'
import { Gift } from 'lucide-react'

interface SponsorButtonProps {
  onClick: () => void
}

export function SponsorButton({ onClick }: SponsorButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group fixed bottom-6 right-6 z-[100] flex items-center justify-center bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white h-12 rounded-full shadow-lg shadow-tesla-red/30 hover:shadow-tesla-red/50 transition-all duration-300 hover:scale-110 active:scale-95 ${isHovered ? 'w-28 px-3' : 'w-12'
        }`}
      aria-label="打赏"
    >
      <Gift className="w-5 h-5 flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100 ml-2' : 'w-0 opacity-0'
          }`}
      >
        打赏
      </span>
    </button>
  )
}
