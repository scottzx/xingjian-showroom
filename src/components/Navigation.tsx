import { Link, useLocation } from 'react-router-dom';
import { Palette, Users } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { to: '/gallery', label: '涂装车间', icon: Palette, requiresAuth: true },
  { to: '/coming-soon', label: '涂装广场', icon: Users },
];

export function Navigation() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-tesla-black/95 backdrop-blur-xl border-b border-tesla-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tesla-red to-red-600 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold hidden sm:block">
              Tesla Wrap Studio
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;

              const Icon = item.icon;
              const active = isActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    active
                      ? 'text-white bg-tesla-red/20'
                      : 'text-tesla-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* Create Button removed */}
          </div>

          {/* Profile Menu */}
          <div className="ml-4">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
