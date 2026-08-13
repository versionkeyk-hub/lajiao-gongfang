import React from 'react';
import { User, RefreshCw, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenUserModal: () => void;
  onRefreshData: () => void;
  onLogout?: () => void;
  onGoAdmin?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenUserModal,
  onRefreshData,
  onLogout,
  onGoAdmin,
  isAdmin,
}) => {
  const effectiveIsAdmin = Boolean(isAdmin || currentUser?.isAdmin || currentUser?.name?.trim().toLowerCase() === 'admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-2xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          <img 
            src="/nong-xiao-wa.svg" 
            alt="农小蛙" 
            className="w-10 h-10 rounded-xl object-contain shadow-xs shrink-0 bg-white p-0.5 border border-emerald-100" 
          />
          <div>
            <h1 className="font-extrabold text-gray-900 text-lg leading-tight flex items-center gap-1.5">
              小蛙种植记（内部自用）
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefreshData}
            title="刷新数据"
            className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Admin Direct Button */}
          {effectiveIsAdmin && onGoAdmin && (
            <button
              onClick={onGoAdmin}
              title="进入小蛙管理后台"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 animate-in fade-in duration-200"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>管理后台</span>
            </button>
          )}

          {/* User Profile Badge */}
          <button
            onClick={onOpenUserModal}
            className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 border rounded-xl text-xs font-bold transition-all shrink-0 ${
              effectiveIsAdmin
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-gray-50 border-gray-200 hover:border-emerald-300 text-gray-800'
            }`}
          >
            <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] overflow-hidden ${
              effectiveIsAdmin ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              {effectiveIsAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              ) : currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.slice(0, 1) || <User className="w-3 h-3" />
              )}
            </div>
            <span className="truncate max-w-[90px]">
              {effectiveIsAdmin ? '管理员(admin)' : (currentUser?.name || '登录')}
            </span>
          </button>

          {/* Explicit Logout Button */}
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              title="退出登录"
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              退出
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
