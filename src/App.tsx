import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plant, CareLog, UserProfile, StatsData, SystemConfig } from './types';
import { fetchPlants, fetchLogs, fetchStats, claimPlant, fetchSystemConfig, subscribePlants, subscribeLogs, subscribeConfig } from './lib/api';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { TimelineFeed } from './components/TimelineFeed';
import { PlantGrid } from './components/PlantGrid';
import { Leaderboard } from './components/Leaderboard';
import { MyProfileTab } from './components/MyProfileTab';
import { AdminConsole } from './components/AdminConsole';
import { CareLogModal } from './components/CareLogModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PlantDetailModal } from './components/PlantDetailModal';
import { TransferModal } from './components/TransferModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { AppVersionModal } from './components/AppVersionModal';
import { RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pepper_user_v2');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name && parsed.name.trim().toLowerCase() === 'admin') {
        parsed.isAdmin = true;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const isEffectiveAdmin = Boolean(currentUser?.isAdmin || currentUser?.name?.trim().toLowerCase() === 'admin');

  const [plants, setPlants] = useState<Plant[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<TabType>('FEED');

  // Active Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [transferringPlant, setTransferringPlant] = useState<Plant | null>(null);

  const [selectedPlantIdForLog, setSelectedPlantIdForLog] = useState<number | undefined>(undefined);
  const [selectedActionTypeForLog, setSelectedActionTypeForLog] = useState<string | undefined>(undefined);
  const [selectedDetailPlant, setSelectedDetailPlant] = useState<Plant | null>(null);

  // Lightbox Image Preview State
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);

  const handlePreviewImage = (url: string, title?: string) => {
    if (!url) return;
    setPreviewImage({ url, title });
  };

  // App Hosting URL
  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ai.studio/build';

  // Load Data from Backend API (with fetching lock & fast fallback)
  const isFetchingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Guaranteed fallback timer to unblock initial loading UI in max 1.2s
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    try {
      await Promise.allSettled([
        fetchPlants().then(data => { if (Array.isArray(data)) setPlants(data); }),
        fetchLogs().then(data => { if (Array.isArray(data)) setLogs(data); }),
        fetchStats().then(data => { if (data) setStats(data); }),
        fetchSystemConfig().then(cfg => { if (cfg) setSystemConfig(cfg); }).catch(() => null)
      ]);
    } catch (err) {
      console.error('Failed to load pepper data:', err);
    } finally {
      clearTimeout(fallbackTimer);
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Initial Load & Real-Time Firestore Synchronization across all devices/platforms
  useEffect(() => {
    loadData();

    const unsubPlants = subscribePlants(data => {
      if (Array.isArray(data) && data.length > 0) setPlants(data);
    });
    const unsubLogs = subscribeLogs(data => {
      if (Array.isArray(data) && data.length > 0) setLogs(data);
    });
    const unsubConfig = subscribeConfig(cfg => {
      if (cfg) setSystemConfig(cfg);
    });

    const interval = setInterval(loadData, 10000);
    return () => {
      unsubPlants();
      unsubLogs();
      unsubConfig();
      clearInterval(interval);
    };
  }, [loadData]);

  const hasHandledUrlRef = useRef(false);

  // Handle URL QR Code Scanning Parameters e.g. ?plantId=3 (Executes ONCE only)
  useEffect(() => {
    if (typeof window !== 'undefined' && plants.length > 0 && !hasHandledUrlRef.current) {
      const params = new URLSearchParams(window.location.search);
      const pidParam = params.get('plantId');
      if (pidParam) {
        hasHandledUrlRef.current = true;
        const pid = parseInt(pidParam, 10);
        const targetPlant = plants.find(p => p.id === pid);
        if (targetPlant) {
          setSelectedDetailPlant(targetPlant);
        }
        // Remove ?plantId=X from address bar to prevent periodic popups
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [plants]);

  const handleUserSaved = (user: UserProfile) => {
    // If user logout was requested (user.id empty)
    if (!user.id && !user.name) {
      handleLogout();
      return;
    }

    const isSavedAdmin = Boolean(user.isAdmin || (user.name && user.name.trim().toLowerCase() === 'admin'));
    const finalUser = {
      ...user,
      isAdmin: isSavedAdmin
    };

    setCurrentUser(finalUser);
    try {
      localStorage.setItem('pepper_user_v2', JSON.stringify(finalUser));
    } catch (e) {
      console.error(e);
    }

    // If logged in as admin, switch to admin tab automatically
    if (isSavedAdmin) {
      setActiveTab('ADMIN');
    }

    loadData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('pepper_user_v2');
    } catch (e) {
      console.error(e);
    }
    setActiveTab('FEED');
    alert('已成功退出账号');
  };

  const handleQuickLog = (plantId?: number, actionType?: string) => {
    if (!currentUser?.name) {
      setIsUserModalOpen(true);
      return;
    }

    const isUserAdmin = Boolean(currentUser.isAdmin || currentUser.name.trim().toLowerCase() === 'admin');
    const userOwnedPlants = plants.filter(p => p && (p.ownerName === currentUser.name || (Array.isArray(p.owners) && p.owners.includes(currentUser.name))));

    if (!isUserAdmin && userOwnedPlants.length === 0) {
      alert(`⚠️ 您好【${currentUser.name}】，您目前尚未认领绑定任何辣椒植株，无法直接进行护理打卡！\n\n请先在【植物列表】中点击“认领该植株”成为认领人。`);
      setActiveTab('PLANTS');
      return;
    }

    let targetPid = plantId;
    if (targetPid) {
      const targetPlant = plants.find(p => p.id === targetPid);
      if (targetPlant && !isUserAdmin) {
        const isOwner = targetPlant.ownerName === currentUser.name || (Array.isArray(targetPlant.owners) && targetPlant.owners.includes(currentUser.name));
        if (!isOwner) {
          alert(`⚠️ 【${targetPlant.code}】属于 ${targetPlant.ownerName ? `同事【${targetPlant.ownerName}】` : '待认领状态'}，您尚未绑定认领该植株，无法直接为其打卡！`);
          return;
        }
      }
    } else {
      targetPid = userOwnedPlants[0]?.id || plants[0]?.id || 1;
    }

    setSelectedPlantIdForLog(targetPid);
    setSelectedActionTypeForLog(actionType);
    setIsLogModalOpen(true);
  };

  const handleQuickCareForPlant = (plantId: number, actionType: '浇水' | '施肥' | '成长拍照') => {
    if (!currentUser?.name) {
      setIsUserModalOpen(true);
      return;
    }
    setSelectedPlantIdForLog(plantId);
    setSelectedActionTypeForLog(actionType);
    setIsLogModalOpen(true);
  };

  const handleClaimPlant = async (plantId: number) => {
    if (!currentUser?.name) {
      alert('请先登录你的身份姓名与密码！');
      setIsUserModalOpen(true);
      return;
    }

    try {
      await claimPlant(plantId, currentUser.id, currentUser.name, currentUser.location || '养护区域');
      alert(`认领绑定成功！此植株已登记在【${currentUser.name}】名下。`);
      loadData();
    } catch (err: any) {
      alert(err.message || '认领失败，每盆植株只能被认领绑定一次');
    }
  };

  const handleOpenPlantDetail = (plantId: number) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      setSelectedDetailPlant(plant);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onRefreshData={loadData}
        onLogout={handleLogout}
        onGoAdmin={() => setActiveTab('ADMIN')}
        isAdmin={isEffectiveAdmin}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Banner if logged in as Admin */}
        {isEffectiveAdmin && activeTab !== 'ADMIN' && (
          <div className="bg-amber-500 text-white rounded-2xl p-3 px-4 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-100" />
              <span>当前为管理员账号 (admin)，拥有最高管理控制权限</span>
            </div>
            <button
              onClick={() => setActiveTab('ADMIN')}
              className="bg-white text-amber-900 font-bold px-3 py-1 rounded-xl shadow-xs hover:bg-amber-50 transition"
            >
              进入管理后台
            </button>
          </div>
        )}

        {/* Banner if not logged in */}
        {!currentUser?.name && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>尚未登录个人账号，登录后扫码领用、打卡记录及修改个人密码。</span>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold shrink-0 hover:bg-amber-700 transition-colors"
            >
              一键登录
            </button>
          </div>
        )}

        {loading && plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">正在同步团队植株与打卡数据...</p>
          </div>
        ) : (
          <>
            {activeTab === 'FEED' && (
              <TimelineFeed
                logs={logs}
                plants={plants}
                currentUserName={currentUser?.name || ''}
                currentUser={currentUser}
                onRefresh={loadData}
                onOpenPlantDetail={handleOpenPlantDetail}
                onQuickLog={handleQuickLog}
                onPreviewImage={handlePreviewImage}
                actionTypesConfig={systemConfig?.actionTypes}
              />
            )}

            {activeTab === 'PLANTS' && (
              <PlantGrid
                plants={plants}
                logs={logs}
                currentUserName={currentUser?.name || ''}
                onOpenPlantDetail={handleOpenPlantDetail}
                onQuickCareForPlant={handleQuickCareForPlant}
                onQuickLog={handleQuickLog}
                onClaimPlant={handleClaimPlant}
                onTransferPlant={(plant) => setTransferringPlant(plant)}
                onPreviewImage={handlePreviewImage}
              />
            )}

            {activeTab === 'STATS' && (
              <Leaderboard
                stats={stats}
                plants={plants}
                onQuickLog={() => handleQuickLog()}
              />
            )}

            {activeTab === 'PROFILE' && (
              <MyProfileTab
                currentUser={currentUser}
                plants={plants}
                logs={logs}
                appUrl={appUrl}
                onOpenLoginModal={() => setIsUserModalOpen(true)}
                onUserUpdated={handleUserSaved}
                onDataRefresh={loadData}
                onOpenPlantDetail={handleOpenPlantDetail}
                onQuickLog={handleQuickLog}
                onPreviewImage={handlePreviewImage}
              />
            )}

            {activeTab === 'ADMIN' && (
              <AdminConsole
                plants={plants}
                onRefreshData={loadData}
                onSelectPlant={(p) => setSelectedDetailPlant(p)}
                onPreviewImage={handlePreviewImage}
                systemConfig={systemConfig}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickLog={() => handleQuickLog()}
        isAdmin={isEffectiveAdmin}
      />

      {/* Modals */}
      <CareLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        currentUser={currentUser}
        plants={plants}
        onLogCreated={loadData}
        defaultPlantId={selectedPlantIdForLog}
        defaultActionType={selectedActionTypeForLog}
        onPreviewImage={handlePreviewImage}
        actionTypesConfig={systemConfig?.actionTypes}
        onGoToClaimPlants={() => setActiveTab('PLANTS')}
      />

      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onUserSaved={handleUserSaved}
      />

      <AppVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />

      <PlantDetailModal
        isOpen={!!selectedDetailPlant}
        onClose={() => setSelectedDetailPlant(null)}
        plant={selectedDetailPlant}
        logs={logs}
        onQuickLogForPlant={handleQuickLog}
        onDataRefresh={loadData}
        onPreviewImage={handlePreviewImage}
      />

      <TransferModal
        isOpen={!!transferringPlant}
        onClose={() => setTransferringPlant(null)}
        plant={transferringPlant}
        currentUser={currentUser}
        onTransferred={loadData}
      />

      {/* Lightbox Modal */}
      <ImageLightboxModal
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
