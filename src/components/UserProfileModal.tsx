import React, { useState, useEffect } from 'react';
import { X, User, Lock, Check, MapPin, ShieldCheck, Key, Camera } from 'lucide-react';
import { UserProfile, PRESET_LOCATIONS } from '../types';
import { authUser } from '../lib/api';
import { AvatarPicker } from './AvatarPicker';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserSaved: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSaved
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [location, setLocation] = useState(currentUser?.location || PRESET_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPassword(currentUser.password || '');
      setAvatar(currentUser.avatar || '');
      if (PRESET_LOCATIONS.includes(currentUser.location || '')) {
        setLocation(currentUser.location || PRESET_LOCATIONS[0]);
        setCustomLocation('');
      } else {
        setLocation('自定义');
        setCustomLocation(currentUser.location || '');
      }
    } else {
      setName('');
      setPassword('');
      setAvatar('');
      setLocation(PRESET_LOCATIONS[0]);
      setCustomLocation('');
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('请输入姓名！');
      return;
    }

    const finalLocation = location === '自定义' ? (customLocation.trim() || '养护区域') : location;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const user = await authUser({
        name: name.trim(),
        password: password.trim(),
        location: finalLocation,
        avatar: avatar || undefined
      });

      onUserSaved(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '登录失败，请检查密码');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">成员账号与头像设置</h3>
              <p className="text-[11px] text-gray-400">设置个人姓名、密码及个人专属头像</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
            <label className="block text-xs font-bold text-gray-800 mb-2 text-center flex items-center justify-center gap-1">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              个人头像（可选择、上传或拍照）
            </label>
            <AvatarPicker
              currentAvatar={avatar}
              userName={name}
              onAvatarSelect={(url) => setAvatar(url)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              你的姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的姓名"
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              个人登录密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入您的密码"
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              养在***（养护区域）
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none transition-all"
            >
              {PRESET_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              <option value="自定义">自定义其他区域...</option>
            </select>

            {location === '自定义' && (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="请输入你的具体养护区域..."
                className="mt-2 w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none transition-all"
              />
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all mt-2"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? '保存更新中...' : '确认保存设置并登录'}
          </button>
        </form>
      </div>
    </div>
  );
};
