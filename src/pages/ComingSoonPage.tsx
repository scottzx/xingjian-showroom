import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';

export function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black">
      <Navigation />

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tesla-red/20 to-red-600/20 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-tesla-red" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">
            涂装广场
          </h1>

          {/* Subtitle */}
          <p className="text-tesla-gray text-lg mb-8">
            敬请期待
          </p>

          {/* Description */}
          <p className="text-tesla-dark mb-12">
            我们正在打造一个激动人心的模板市场，让您可以分享创意、发现精彩设计。
            <br /><br />
            Coming Soon...
          </p>

          {/* Back Button */}
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white font-medium rounded-lg shadow-lg shadow-tesla-red/20 hover:shadow-tesla-red/30 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            返回画廊
          </Link>
        </div>
      </div>
    </div>
  );
}
