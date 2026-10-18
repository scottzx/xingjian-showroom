import { Link } from 'react-router-dom';
import { Palette, Sparkles } from 'lucide-react';

interface GalleryEmptyProps {
  onCreateNew?: () => void;
}

export function GalleryEmpty({ onCreateNew }: GalleryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icon */}
      <div className="mb-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-tesla-red/10 to-red-600/10 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tesla-red/20 to-red-600/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-tesla-red/60" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">
        开始您的创作之旅
      </h2>

      {/* Subtitle */}
      <p className="text-tesla-gray text-center max-w-md mb-8">
        您的画廊还是空的。创建您的第一个涂装设计，
        让您的爱车独一无二。
      </p>

      {/* Create Button */}
      <Link
        to="/editor"
        onClick={onCreateNew}
        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white font-medium rounded-xl shadow-lg shadow-tesla-red/20 hover:shadow-tesla-red/30 transition-all duration-200 text-lg"
      >
        <Palette className="w-6 h-6" />
        创建新项目
      </Link>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-tesla-dark/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🎨</span>
          </div>
          <p className="text-sm text-tesla-gray">使用画笔、文字、形状等工具</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-tesla-dark/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🚗</span>
          </div>
          <p className="text-sm text-tesla-gray">支持 9 款 Tesla 车型</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-tesla-dark/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">✨</span>
          </div>
          <p className="text-sm text-tesla-gray">实时 3D 预览效果</p>
        </div>
      </div>
    </div>
  );
}
