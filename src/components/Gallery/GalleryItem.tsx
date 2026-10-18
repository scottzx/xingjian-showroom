import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { SavedDesign } from '../../utils/supabaseProjects';
import { carModels } from '../../data/carModels';
import { useBlobUrl } from '../../utils/imageLoader';
import { useTranslation } from 'react-i18next';

interface GalleryItemProps {
  design: SavedDesign;
}

export function GalleryItem({ design }: GalleryItemProps) {
  const { t } = useTranslation();

  // Use blob URL for Supabase images to bypass COEP restrictions
  const imageUrl = design.preview_thumbnail_url || design.preview_image_url;
  const { blobUrl: safeImageUrl } = useBlobUrl(imageUrl || null);

  // Find car model display name
  const carModel = carModels.find((m) => m.id === design.model_id);
  const modelName = carModel ? (t(`carModels.${carModel.id}` as any) as string) : design.model_id;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Link
      to={`/editor?designId=${design.id}`}
      className="group block"
    >
      <div className="bg-tesla-black/60 hover:bg-tesla-black/80 border border-tesla-dark/50 hover:border-tesla-gray/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl">
        {/* Preview Image */}
        <div className="aspect-square bg-gradient-to-br from-tesla-dark/20 to-tesla-black/40 relative overflow-hidden">
          {safeImageUrl ? (
            <img
              src={safeImageUrl}
              alt={design.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tesla-dark/50">
              <span className="text-4xl">🎨</span>
            </div>
          )}

          {/* Visibility Badge */}
          {design.visibility === 'private' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white/70">
              私密
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-medium truncate mb-1" title={design.title}>
            {design.title}
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-tesla-gray truncate">{modelName}</span>
            <span className="text-tesla-dark flex items-center gap-1" title={new Date(design.updated_at).toLocaleString('zh-CN')}>
              <Clock className="w-3 h-3" />
              {formatDate(design.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
