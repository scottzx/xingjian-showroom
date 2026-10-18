import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../utils/profile';
import { useProfileStore } from '../stores/useProfileStore';
import { Mail, Calendar, Palette, Camera, Save } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, isLoading, fetchProfile, setProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize display name when profile loads
  useEffect(() => {
    if (!user) return;

    // Fetch if not loaded
    if (!profile || profile.id !== user.id) {
      fetchProfile(user.id);
    }
  }, [user?.id, profile?.id]);

  // Update display name when profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const updated = await updateUserProfile(user.id, { display_name: displayName });

    // Update store with new profile data (no need to refetch)
    setProfile(updated);

    setSaving(false);
    setEditing(false);
  };

  const getInitials = (email: string | null, displayName: string | null) => {
    if (displayName) {
      const parts = displayName.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-tesla-light">Loading...</div>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile?.email || null, profile?.display_name || null);
  const displayNameValue = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black">
      <Navigation />

      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-8">个人资料</h1>

        {/* Profile Card */}
        <div className="bg-tesla-black/60 backdrop-blur-xl border border-tesla-dark/50 rounded-2xl p-8">
          {/* Avatar Section */}
          <div className="flex items-start gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-tesla-red to-red-600 flex items-center justify-center flex-shrink-0">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={displayNameValue}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-medium">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-tesla-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold text-white bg-tesla-dark/30 border border-tesla-gray/30 rounded-lg px-3 py-2 w-full max-w-md"
                  placeholder="Display name"
                />
              ) : (
                <h2 className="text-2xl font-bold text-white">{displayNameValue}</h2>
              )}
              <p className="text-tesla-gray flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profile?.email || user?.email}
              </p>
              <p className="text-tesla-dark flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              disabled={saving}
            >
              {editing ? (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </>
              ) : (
                'Edit'
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-tesla-dark/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-tesla-gray flex items-center justify-center gap-1">
                <Palette className="w-3 h-3" />
                Designs
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-tesla-gray">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Free</div>
              <div className="text-sm text-tesla-gray">Plan</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Link
            to="/gallery"
            className="bg-tesla-black/60 hover:bg-tesla-black/80 border border-tesla-dark/50 hover:border-tesla-gray/50 rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-tesla-red/20 to-red-600/20 flex items-center justify-center">
                <Palette className="w-6 h-6 text-tesla-red" />
              </div>
              <div>
                <h3 className="text-white font-medium">涂装车间</h3>
                <p className="text-sm text-tesla-gray">我的设计画廊</p>
              </div>
            </div>
          </Link>

          <Link
            to="/editor"
            className="bg-tesla-black/60 hover:bg-tesla-black/80 border border-tesla-dark/50 hover:border-tesla-gray/50 rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-tesla-red/20 to-red-600/20 flex items-center justify-center">
                <Palette className="w-6 h-6 text-tesla-red" />
              </div>
              <div>
                <h3 className="text-white font-medium">涂装车间</h3>
                <p className="text-sm text-tesla-gray">创建新设计</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
