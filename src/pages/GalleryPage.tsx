import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { GalleryItem } from '../components/Gallery/GalleryItem';
import { GalleryEmpty } from '../components/Gallery/GalleryEmpty';
import { GallerySkeleton } from '../components/Gallery/GallerySkeleton';
import { NewProjectDialog } from '../editor/components/NewProjectDialog';
import { Palette, Plus, Lock } from 'lucide-react';
import { getUserDesigns, FREE_USER_DESIGN_LIMIT } from '../utils/supabaseProjects';
import type { SavedDesign } from '../utils/supabaseProjects';

export function GalleryPage() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const designsData = await getUserDesigns();
        setDesigns(designsData);
      } catch (error) {
        console.error('Failed to fetch designs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  const handleCreateProject = () => {
    console.log('[GalleryPage] handleCreateProject called');
    // Dialog has already set up the state via useEditorStore
    // Navigate to editor
    console.log('[GalleryPage] Navigating to /editor');
    navigate('/editor');
    console.log('[GalleryPage] Navigation call completed');
  };

  const designCount = designs.length;
  const isNearLimit = designCount >= FREE_USER_DESIGN_LIMIT * 0.8;
  const isAtLimit = designCount >= FREE_USER_DESIGN_LIMIT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black">
      <Navigation />

      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              涂装车间
            </h1>
            <p className="text-tesla-gray">
              我的设计画廊 · {designCount} / {FREE_USER_DESIGN_LIMIT} 个项目
            </p>
          </div>

          {/* Create Button */}
          <button
            onClick={() => {
              console.log('[GalleryPage] Create button clicked');
              console.log('[GalleryPage] isAtLimit:', isAtLimit);
              if (isAtLimit) {
                // Could show upgrade dialog here
                console.log('[GalleryPage] User at limit, showing alert');
                alert('已达到免费用户项目限制。升级到高级版以创建更多项目。');
              } else {
                console.log('[GalleryPage] Opening new project dialog');
                setShowNewProjectDialog(true);
              }
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isAtLimit
                ? 'bg-tesla-dark/50 text-tesla-gray cursor-not-allowed'
                : 'bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white shadow-lg shadow-tesla-red/20 hover:shadow-tesla-red/30'
            }`}
          >
            {isAtLimit ? (
              <>
                <Lock className="w-5 h-5" />
                已达限制
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                创建新项目
              </>
            )}
          </button>
        </div>

        {/* Limit Warning */}
        {isNearLimit && !isAtLimit && (
          <div className="mb-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <Lock className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-200 text-sm">
              您已使用了 {designCount} / {FREE_USER_DESIGN_LIMIT} 个项目。
              升级到高级版可解锁更多项目空间。
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <GallerySkeleton />
        ) : (
          <>
            {/* Empty State */}
            {designs.length === 0 ? (
              <GalleryEmpty />
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {designs.map((design) => (
                    <GalleryItem key={design.id} design={design} />
                  ))}
                </div>

                {/* Quick Actions Footer */}
                <div className="mt-12 pt-8 border-t border-tesla-dark/30">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <p className="text-tesla-dark text-sm">
                      提示：点击项目卡片即可继续编辑
                    </p>
                    <Link
                      to="/coming-soon"
                      className="text-tesla-gray hover:text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      发现更多灵感
                    </Link>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
