import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Zap, Users, Star, ArrowRight, Check } from 'lucide-react';
import { ProfileMenu } from '../components/ProfileMenu';
import { LoginDialog } from '../components/LoginDialog';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartCreating = () => {
    if (user) {
      // 已登录，直接进入编辑器
      navigate('/editor');
    } else {
      // 未登录，弹出登录对话框
      setIsLoginDialogOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    // 登录成功后导航到编辑器
    navigate('/editor');
  };
  const features = [
    {
      icon: Palette,
      title: '专业设计工具',
      description: '画笔、文字、形状等多种工具，轻松创建独特的涂装设计',
    },
    {
      icon: Star,
      title: '实时3D预览',
      description: '在3D车型模型上实时查看您的涂装效果',
    },
    {
      icon: Users,
      title: '社区分享',
      description: '分享您的创意设计，发现其他用户的精彩作品',
    },
  ];

  const models = [
    'Cybertruck',
    'Model 3',
    'Model 3 Highland',
    'Model Y',
    'Model Y Highland',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-tesla-black/95 backdrop-blur-xl border-b border-tesla-dark/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tesla-red to-red-600 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">
                Tesla Wrap Studio
              </span>
            </div>

            {/* Profile Menu */}
            <div className="ml-4">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-tesla-red/10 border border-tesla-red/30 rounded-full text-tesla-red text-sm mb-6">
            <Zap className="w-4 h-4" />
            支持 Tesla 2025 假日更新
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            特斯拉喷漆车间
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tesla-red to-red-600">
              外观定制
            </span>
          </h1>

          <p className="text-xl text-tesla-gray mb-8 max-w-2xl mx-auto">
            为您的爱车设计独一无二的外观涂装。使用我们强大的在线编辑器，
            轻松创建专属于您的 Tesla 个性化设计。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/editor/free')}
              className="px-8 py-4 bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white font-medium rounded-lg shadow-lg shadow-tesla-red/20 hover:shadow-tesla-red/30 transition-all duration-200 inline-flex items-center gap-2"
            >
              免费试用
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleStartCreating}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 inline-flex items-center gap-2"
            >
              登录保存作品
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            为什么选择我们
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-tesla-black/60 backdrop-blur-xl border border-tesla-dark/50 rounded-2xl p-8 hover:border-tesla-gray/50 transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-tesla-red/20 to-red-600/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-tesla-red" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-tesla-gray">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-tesla-black/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            如何使用
          </h2>

          <div className="space-y-6">
            {[
              { step: '01', title: '创建设计', desc: '使用我们的在线编辑器设计您的专属涂装' },
              { step: '02', title: '导出文件', desc: '将设计导出为 1024x1024 PNG 格式' },
              { step: '03', title: '上传到车机', desc: '将文件放入 U 盘 Wraps 文件夹，插入车辆' },
              { step: '04', title: '享受独特', desc: '在车机喷漆车间中预览您的个性化外观' },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-6 bg-tesla-black/60 backdrop-blur-xl border border-tesla-dark/50 rounded-xl p-6"
              >
                <span className="text-4xl font-bold text-tesla-red/30">{item.step}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-tesla-gray">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Models */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            支持的车型
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {models.map((model) => (
              <div
                key={model}
                className="px-6 py-3 bg-tesla-black/60 border border-tesla-dark/50 rounded-full text-tesla-gray flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-tesla-red" />
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-tesla-red/20 to-red-600/20 border border-tesla-red/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好开始创作了吗？
            </h2>
            <p className="text-tesla-gray mb-8">
              免费试用我们的编辑器，或登录保存作品到云端
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/editor/free')}
                className="px-8 py-4 bg-gradient-to-r from-tesla-red to-[#9d252c] hover:from-[#9d252c] hover:to-[#8a1f25] text-white font-medium rounded-lg shadow-lg shadow-tesla-red/20 hover:shadow-tesla-red/30 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Palette className="w-5 h-5" />
                免费试用
              </button>
              <button
                onClick={handleStartCreating}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 inline-flex items-center gap-2"
              >
                登录保存作品
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-tesla-dark/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-tesla-dark text-sm">
            ⚠️ 本站是独立的第三方工具，与 Tesla, Inc. 没有任何关联。
            <br />
            Tesla、Cybertruck、Model 3、Model Y 等均为 Tesla, Inc. 的注册商标。
          </p>
          <p className="text-tesla-dark/60 text-xs mt-4">
            © 2026 Tesla Wrap Studio. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
