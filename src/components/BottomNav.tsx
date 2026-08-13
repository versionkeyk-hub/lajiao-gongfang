import React from 'react';
import { Activity, Sprout, BarChart3, Plus, User, ShieldCheck } from 'lucide-react';

export type TabType = 'FEED' | 'PLANTS' | 'STATS' | 'PROFILE' | 'ADMIN';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickLog: () => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onQuickLog,
  isAdmin
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100/80 shadow-lg py-2 px-3">
      <div className="max-w-md w-full mx-auto flex items-center justify-between relative px-2">
        {/* Left Tabs Group */}
        <div className="flex items-center justify-around flex-1 max-w-[170px]">
          {/* Tab 1: 动态 */}
          <button
            onClick={() => onTabChange('FEED')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'FEED' ? 'text-emerald-700 font-bold bg-emerald-50 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Activity className={`w-5 h-5 mb-0.5 ${activeTab === 'FEED' ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[11px] whitespace-nowrap">动态</span>
          </button>

          {/* Tab 2: 看看大家 */}
          <button
            onClick={() => onTabChange('PLANTS')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'PLANTS' ? 'text-emerald-700 font-bold bg-emerald-50 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sprout className={`w-5 h-5 mb-0.5 ${activeTab === 'PLANTS' ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[11px] whitespace-nowrap">看看大家</span>
          </button>
        </div>

        {/* Center Action Button: ➕ 记一笔 */}
        <div className="relative -top-3.5 shrink-0 mx-2 z-10">
          <button
            onClick={onQuickLog}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-400/40 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border-2 border-white"
            title="记一笔养护"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>

        {/* Right Tabs Group */}
        <div className="flex items-center justify-around flex-1 max-w-[170px]">
          {/* Tab 3: 统计 */}
          <button
            onClick={() => onTabChange('STATS')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'STATS' ? 'text-emerald-700 font-bold bg-emerald-50 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'STATS' ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[11px] whitespace-nowrap">统计</span>
          </button>

          {/* Tab 4: 我的 */}
          <button
            onClick={() => onTabChange('PROFILE')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'PROFILE' ? 'text-emerald-700 font-bold bg-emerald-50 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className={`w-5 h-5 mb-0.5 ${activeTab === 'PROFILE' ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[11px] whitespace-nowrap">我的</span>
          </button>

          {/* Tab 5: 管理后台 (Only for Admin) */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('ADMIN')}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
                activeTab === 'ADMIN' ? 'text-amber-700 font-bold bg-amber-50 scale-105' : 'text-amber-500 hover:text-amber-700'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 mb-0.5 ${activeTab === 'ADMIN' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[11px] whitespace-nowrap">管理</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
