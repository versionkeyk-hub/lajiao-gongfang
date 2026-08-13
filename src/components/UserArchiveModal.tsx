import React, { useState, useEffect } from 'react';
import { X, User, Sprout, MapPin, Calendar, Award, ExternalLink, ChevronRight } from 'lucide-react';
import { Plant, UserProfile } from '../types';
import { fetchUsers } from '../lib/api';

interface UserArchiveModalProps {
  userName: string | null;
  onClose: () => void;
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onPreviewImage?: (url: string, title?: string) => void;
}

export const UserArchiveModal: React.FC<UserArchiveModalProps> = ({
  userName,
  onClose,
  plants,
  onSelectPlant,
  onPreviewImage,
}) => {
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userName) return;
    setLoading(true);
    fetchUsers()
      .then(users => {
        const found = users.find(u => u.name === userName);
        if (found) {
          setUserInfo(found);
        } else {
          setUserInfo({
            id: 'temp',
            name: userName,
            registeredAt: '近期'
          });
        }
      })
      .catch(() => {
        setUserInfo({
          id: 'temp',
          name: userName,
          registeredAt: '近期'
        });
      })
      .finally(() => setLoading(false));
  }, [userName]);

  useEffect(() => {
    if (userName) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [userName]);

  if (!userName) return null;

  // Filter plants owned by this user
  const userPlants = plants.filter(p => p.ownerName === userName || p.owners.includes(userName));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background Banner */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 -z-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="relative z-10 pt-6">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-emerald-500/20 overflow-hidden shrink-0 cursor-pointer"
                onClick={() => userInfo?.avatar && onPreviewImage?.(userInfo.avatar, `${userName} 头像`)}
              >
                {userInfo?.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userName}
                    className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-2xl">
                    {userName[0]}
                  </div>
                )}
              </div>

              <div className="text-white pb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {userName}
                  </h3>
                  {userInfo?.isAdmin && (
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                      管理员
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {userInfo?.location || '养护区域'}
                </p>
              </div>
            </div>
          </div>

          {/* User Stats Bar */}
          <div className="grid grid-cols-2 gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/80 mb-5">
            <div className="text-center border-r border-emerald-200/60">
              <span className="text-[10px] text-gray-500 block">拥有植物</span>
              <span className="text-base font-extrabold text-emerald-800 flex items-center justify-center gap-1">
                <Sprout className="w-4 h-4 text-emerald-600" />
                {userPlants.length} 盆
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-500 block">注册时间</span>
              <span className="text-xs font-bold text-gray-700 flex items-center justify-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {userInfo?.registeredAt || '活跃成员'}
              </span>
            </div>
          </div>

          {/* User Plants Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                【{userName}】管理的植物档案 ({userPlants.length})
              </h4>
              <span className="text-[11px] text-gray-400">点击卡片可查看详情</span>
            </div>

            {userPlants.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                该成员暂未领用认领植物
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {userPlants.map(plant => (
                  <div
                    key={plant.id}
                    onClick={() => {
                      onClose();
                      onSelectPlant(plant);
                    }}
                    className="p-3 bg-white hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-300 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative group/img cursor-pointer shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage?.((plant as any).image || plant.avatar || plant.initialAvatar || '', `${plant.code} 照片`);
                        }}
                      >
                        <img
                          src={plant.avatar || plant.initialAvatar}
                          alt={plant.code}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-100 group-hover/img:scale-105 transition-all"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                          大图
                        </span>
                      </div>
                      <div>
                        <div className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          {plant.code}
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                            {plant.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          位置: {plant.location} • 健康度: {plant.health}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                      <span>查看</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
