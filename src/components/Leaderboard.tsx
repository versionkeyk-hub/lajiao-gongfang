import React from 'react';
import { BarChart3, Users, MapPin, Activity, HeartHandshake } from 'lucide-react';
import { Plant } from '../types';

interface LeaderboardProps {
  stats: any;
  plants: Plant[];
  onQuickLog: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ stats, plants, onQuickLog }) => {
  const usersList = stats?.users || [];

  return (
    <div className="space-y-4 pb-20">
      {/* Overview Statistics Header */}
      <div className="bg-gradient-to-tr from-emerald-800 to-teal-900 rounded-3xl p-5 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl">
              📊
            </div>
            <div>
              <h2 className="font-bold text-lg">养护统计</h2>
              <p className="text-xs text-emerald-100">团队养护数据与成员参与概览</p>
            </div>
          </div>
          <button
            onClick={onQuickLog}
            className="bg-white text-emerald-900 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:bg-emerald-50 transition-colors shrink-0"
          >
            记一笔操作
          </button>
        </div>

        {/* Core Metric Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/20">
            <span className="text-[10px] text-emerald-100 block">注册园丁</span>
            <span className="font-black text-lg">{stats?.totalUsers || 0} <span className="text-xs font-normal">人</span></span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/20">
            <span className="text-[10px] text-emerald-100 block">已认领植株</span>
            <span className="font-black text-lg">{plants.filter(p => p.claimed).length} <span className="text-xs font-normal">盆</span></span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/20">
            <span className="text-[10px] text-emerald-100 block">累计操作记录</span>
            <span className="font-black text-lg">{stats?.totalLogs || 0} <span className="text-xs font-normal">次</span></span>
          </div>
        </div>
      </div>

      {/* Member Activity List */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            成员养护统计表
          </h3>
          <span className="text-xs text-gray-400">共 {usersList.length} 位成员</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {usersList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
          ) : (
            usersList.map((u: any) => (
              <div
                key={u.id || u.name}
                className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.slice(0, 2)
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                      {u.isAdmin && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                          管理员
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-emerald-800 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>养在：{u.location || '自选养护区域'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-700">
                    操作 <strong className="text-emerald-800 text-sm">{u.careCount}</strong> 次
                  </div>
                  {u.helpedCount > 0 && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5 justify-end">
                      <HeartHandshake className="w-3 h-3 text-amber-600" />
                      <span>照顾他人 {u.helpedCount} 次</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
