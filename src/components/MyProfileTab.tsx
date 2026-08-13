import React, { useState, useEffect } from 'react';
import { User, Lock, QrCode, ShieldCheck, Sprout, Edit3, Check, Trash2, Key, Download, MapPin, AlertCircle, Eye, ArrowRight, RefreshCw, CheckCircle2, FileText, Plus, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Plant, UserProfile, CareLog, PRESET_LOCATIONS } from '../types';
import { updatePlant, authUser, fetchUsers, adminDeleteUser, adminResetUserPassword } from '../lib/api';
import { AvatarPicker } from './AvatarPicker';

interface MyProfileTabProps {
  currentUser: UserProfile | null;
  plants: Plant[];
  logs?: CareLog[];
  appUrl: string;
  onOpenLoginModal: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onDataRefresh: () => void;
  onOpenPlantDetail: (plantId: number) => void;
  onQuickLog?: (plantId?: number) => void;
  onPreviewImage?: (url: string, title?: string) => void;
}

export const MyProfileTab: React.FC<MyProfileTabProps> = ({
  currentUser,
  plants,
  logs = [],
  appUrl,
  onOpenLoginModal,
  onUserUpdated,
  onDataRefresh,
  onOpenPlantDetail,
  onQuickLog,
  onPreviewImage,
}) => {
  // States for password/profile editing
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(currentUser?.password || '123');
  const [newLocation, setNewLocation] = useState(currentUser?.location || '养护区域');
  const [newAvatar, setNewAvatar] = useState(currentUser?.avatar || '');
  const [isSavingUser, setIsSavingUser] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNewPassword(currentUser.password || '123');
      setNewLocation(currentUser.location || '养护区域');
      setNewAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Stage editing per plant
  const [editingStagePlantId, setEditingStagePlantId] = useState<number | null>(null);
  const [stageInput, setStageInput] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Selected QR Code preview modal
  const [selectedQrPlant, setSelectedQrPlant] = useState<Plant | null>(null);

  // Admin states
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const STAGE_OPTIONS = ['芽苗期', '定植期', '生长期', '开花期', '挂果期', '采收期'];

  // Helper for QR url
  const getPlantQrUrl = (plantId: number) => {
    return `${appUrl || window.location.href.split('?')[0]}?plantId=${plantId}`;
  };

  // Print all plant QR tags for admin
  const handlePrintAllQrTags = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const tagsHtml = plants.map(p => `
      <div style="border:2px solid #2d6a4f; padding:15px; width:220px; text-align:center; font-family:sans-serif; page-break-inside:avoid; border-radius:12px; margin:10px; display:inline-block; background:#fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <div style="font-size:16px; font-weight:bold; color:#1b4332;">农小蛙 - 专属植物挂牌</div>
        <div style="font-size:22px; font-weight:900; margin:6px 0; color:#2d6a4f;">${p.code}</div>
        <div style="font-size:11px; color:#555; margin-bottom:8px;">放置区域：${p.location}</div>
        <div id="qr-${p.id}" style="display:flex; justify-content:center; align-items:center;"></div>
        <div style="font-size:10px; color:#666; margin-top:8px; font-weight:bold;">用手机微信/相机扫码绑定归属</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>农小蛙 - 植株专属二维码挂牌打印页</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
            body { font-family: sans-serif; background: #f4f6f8; padding: 20px; text-align: center; }
            @media print { body { background: #fff; padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h2 style="color:#1b4332; margin-bottom:4px;">【农小蛙管理员专用】全厂植株专属二维码挂牌导出页</h2>
          <p style="color:#666; font-size:13px; margin-bottom:16px;">请打印后剪下悬挂至办公区对应花盆上，员工扫码即可自动解锁认领！</p>
          <button class="no-print" onclick="window.print()" style="padding:10px 24px; background:#2d6a4f; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px; margin-bottom:20px;">点击立即打印 / 导出为PDF挂牌</button>
          <div>${tagsHtml}</div>
          <script>
            const plantData = ${JSON.stringify(plants.map(p => ({ id: p.id, url: getPlantQrUrl(p.id) })))};
            plantData.forEach(p => {
              const el = document.getElementById('qr-' + p.id);
              if (el) {
                new QRCode(el, {
                  text: p.url,
                  width: 140,
                  height: 140
                });
              }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter plants owned by current user
  const myPlants = plants.filter(p => p.ownerName === currentUser?.name || p.owners?.includes(currentUser?.name || ''));
  const myPlantIds = myPlants.map(p => p.id);

  // Filter logs for current user OR current user's plants
  const myLogs = logs.filter(l => 
    !l.isDeleted && (
      (currentUser?.name && (l.userName === currentUser.name || l.userName?.trim() === currentUser.name.trim())) ||
      (currentUser?.id && l.userId === currentUser.id) ||
      (l.plantIds && l.plantIds.some(pid => myPlantIds.includes(pid)))
    )
  );

  // Count logs specifically published by this user
  const myOwnLogsCount = logs.filter(l => 
    (currentUser?.name && (l.userName === currentUser.name || l.userName?.trim() === currentUser.name.trim())) ||
    (currentUser?.id && l.userId === currentUser.id)
  ).length;

  // Handle User Password/Location/Avatar Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.name) return;
    setIsSavingUser(true);
    try {
      const updated = await authUser({
        name: currentUser.name,
        password: newPassword.trim(),
        location: newLocation.trim(),
        avatar: newAvatar
      });
      onUserUpdated(updated);
      setIsEditingPassword(false);
      alert('个人头像与档案资料更新成功！');
    } catch (err: any) {
      alert(err.message || '更新失败');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle Plant Stage Update
  const handleUpdatePlantStage = async (plantId: number) => {
    if (!stageInput.trim()) {
      alert('阶段不能为空');
      return;
    }
    setIsUpdatingStage(true);
    try {
      await updatePlant(plantId, { status: stageInput.trim() as any });
      onDataRefresh();
      setEditingStagePlantId(null);
      alert('植株生长阶段已成功更新！');
    } catch (err: any) {
      alert(err.message || '阶段更新失败');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Admin: Load Users List
  const handleLoadUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await fetchUsers();
      setUsersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Admin: Reset Password
  const handleResetUserPassword = async (userId: string, userName: string) => {
    const newPwd = window.prompt(`请输入要为成员【${userName}】重置的新密码（例如：888888）：`, '888888');
    if (newPwd === null) return;
    try {
      const res = await adminResetUserPassword(userId, newPwd.trim() || '888888');
      alert(res.message || `已为【${userName}】重置密码`);
      handleLoadUsers();
    } catch (err: any) {
      alert(err.message || '重置密码失败');
    }
  };

  // Admin: Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userName === '张伟' || userName === '李娜' || userName === 'admin') {
      alert(`【提示】账号 ${userName} 为测试保护账号，不能删除！`);
      return;
    }
    if (!window.confirm(`确认要删除成员【${userName}】账号及其关联的领用登记吗？`)) {
      return;
    }
    try {
      await adminDeleteUser(userId);
      alert(`已成功注销成员【${userName}】`);
      handleLoadUsers();
      onDataRefresh();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Top Banner / User Credentials Overview */}
      {!currentUser?.name ? (
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
            👤
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">未登录账号</h3>
            <p className="text-xs text-gray-500 mt-1">登录个人姓名与密码后可查看我的档案、编辑植株阶段及专属二维码</p>
          </div>
          <button
            onClick={onOpenLoginModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md shadow-emerald-200 transition-all inline-flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            一键登录 / 注册账号
          </button>
        </div>
      ) : currentUser.isAdmin ? (
        /* ADMIN DASHBOARD */
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="bg-amber-800/60 text-amber-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  管理员模式已激活
                </span>
                <h3 className="font-extrabold text-lg text-white">管理员控制中心</h3>
              </div>
            </div>
            <button
              onClick={onOpenLoginModal}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm transition-colors"
            >
              切换用户
            </button>
          </div>

          <div className="bg-amber-900/40 backdrop-blur-md rounded-2xl p-3 border border-amber-300/30 text-xs space-y-1">
            <div className="flex items-center gap-2 text-amber-100 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
              <span>权限提示</span>
            </div>
            <p className="text-[11px] text-amber-200/90">管理员可重置成员密码、管理团队成员与解绑变动人员的植物归属。</p>
          </div>

          {/* User Accounts Management Section */}
          <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                全厂成员账号列表
              </h4>
              <button
                onClick={handleLoadUsers}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                刷新列表
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {usersList.length === 0 ? (
                <button
                  onClick={handleLoadUsers}
                  className="w-full py-2 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200"
                >
                  {loadingUsers ? '加载中...' : '点击加载全厂成员列表'}
                </button>
              ) : (
                usersList.map(u => (
                  <div key={u.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isAdmin && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">管理员</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        养在: {u.location || '未设'}
                      </div>
                    </div>

                    {!u.isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResetUserPassword(u.id, u.name)}
                          className="px-2 py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold border border-amber-200/60"
                        >
                          <Key className="w-3 h-3 text-amber-600" />
                          重置密码
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold border border-rose-200/60"
                        >
                          <Trash2 className="w-3 h-3" />
                          注销
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ADMIN ONLY: All Plant QR Codes & Tag Export */}
          <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm space-y-3 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  全厂植株专属二维码库 (管理员专用)
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  仅管理员可见。点击按钮可批量生成并导出所有植物的实体挂牌二维码。
                </p>
              </div>

              <button
                onClick={handlePrintAllQrTags}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                导出/打印全部挂牌
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {plants.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedQrPlant(p)}
                  className="p-2 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/60 rounded-xl text-center space-y-1 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="font-extrabold text-xs text-gray-900">{p.code}</div>
                  <div className="text-[10px] text-gray-500 truncate">{p.location}</div>
                  <div className="bg-white p-1 rounded-lg inline-block border border-amber-200 my-0.5 shadow-2xs">
                    <QRCodeSVG
                      value={getPlantQrUrl(p.id)}
                      size={64}
                      level="L"
                    />
                  </div>
                  <div className="text-[9px] font-bold text-amber-800">
                    {p.claimed ? `【已领: ${p.ownerName}】` : '【未领用】'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL USER PROFILE HEADER */
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-100 shrink-0 cursor-pointer overflow-hidden group"
                onClick={onOpenLoginModal}
                title="点击修改账号/更换头像"
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform" />
                ) : (
                  currentUser.name.slice(0, 1)
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-base">{currentUser.name}</h3>
                  <button
                    onClick={onOpenLoginModal}
                    className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full font-bold border border-emerald-200"
                  >
                    修改头像
                  </button>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  养在：<strong className="text-emerald-800 font-bold">{currentUser.location || '自选养护区域'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingPassword(!isEditingPassword)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200 transition-colors flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                更换头像/修改密码
              </button>
              <button
                onClick={onOpenLoginModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
              >
                切换账号
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要退出当前登录账号吗？')) {
                    onUserUpdated({ id: '', name: '', registeredAt: '' });
                  }
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl font-bold text-xs border border-rose-200 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* User Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-center">
            <div>
              <span className="text-[10px] text-gray-500 block font-medium">领用植物</span>
              <span className="text-sm font-extrabold text-emerald-800 flex items-center justify-center gap-1 mt-0.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                {myPlants.length} 盆
              </span>
            </div>
            <div className="border-x border-emerald-200/60">
              <span className="text-[10px] text-gray-500 block font-medium">我的打卡数</span>
              <span className="text-sm font-extrabold text-teal-800 flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                {myOwnLogsCount} 次
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block font-medium">名下植株日志</span>
              <span className="text-sm font-extrabold text-emerald-900 flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                {myLogs.length} 条
              </span>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditingPassword && (
            <form onSubmit={handleSaveProfile} className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-4 animate-in fade-in duration-150">
              <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1 border-b border-emerald-200 pb-2">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                修改我的个人头像、密码及养护区域
              </h4>

              {/* Avatar Picker Component */}
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <label className="block text-[11px] font-bold text-gray-700 mb-2 text-center">修改个人头像（拍照、上传或选择预设）</label>
                <AvatarPicker
                  currentAvatar={newAvatar}
                  userName={currentUser.name}
                  onAvatarSelect={(url) => setNewAvatar(url)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">设置新密码</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入个人登录密码"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">养在***（养护区域）</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="例如：技术部办公区、财务办公区"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-200/60 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  保存头像与修改
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 1. 我的苗的档案与专属二维码 (My Plants Archive & QR Codes) */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sprout className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm">我已认领的植物与二维码 ({myPlants.length})</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">阶段可自定义修改</span>
        </div>

        {myPlants.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500 space-y-2">
            <p>你名下暂未绑定/认领任何植物</p>
            <p className="text-[11px] text-emerald-700 font-semibold">请在“看看大家”标签页中或通过扫描盆栽二维码认领植物</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myPlants.map(plant => (
              <div
                key={plant.id}
                className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => onPreviewImage?.((plant as any).image || plant.avatar || '', `${plant.code} 照片`)}
                  >
                    <img
                      src={plant.avatar}
                      alt={plant.code}
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-200 group-hover:scale-105 transition-all"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                      大图
                    </span>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-gray-900 text-sm">{plant.code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {plant.health}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      养在：{plant.location}
                    </p>

                    {/* Stage display and editor */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-gray-500">当前阶段:</span>
                      <span className="font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg">
                        {plant.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage Editor Toggle */}
                {editingStagePlantId === plant.id ? (
                  <div className="bg-white p-2 rounded-xl border border-emerald-300 space-y-2 text-xs animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-gray-700">更新该植物的生长阶段：</label>
                    
                    <div className="flex flex-wrap gap-1">
                      {STAGE_OPTIONS.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStageInput(st)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            stageInput === st
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={stageInput}
                      onChange={(e) => setStageInput(e.target.value)}
                      placeholder="或自定义阶段描述..."
                      className="w-full border border-gray-200 rounded-lg p-1.5 text-xs text-gray-900 outline-none focus:border-emerald-500"
                    />

                    <div className="flex justify-end gap-1 pt-1">
                      <button
                        onClick={() => setEditingStagePlantId(null)}
                        className="px-2.5 py-1 text-[11px] text-gray-500 font-bold"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleUpdatePlantStage(plant.id)}
                        disabled={isUpdatingStage}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-[11px] font-bold shadow-xs"
                      >
                        保存阶段
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-100/60">
                    <button
                      onClick={() => {
                        setEditingStagePlantId(plant.id);
                        setStageInput(plant.status);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      修改阶段
                    </button>

                    <button
                      onClick={() => setSelectedQrPlant(plant)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      专属二维码
                    </button>

                    <button
                      onClick={() => onOpenPlantDetail(plant.id)}
                      className="text-[11px] text-gray-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      查看档案
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 我的植株与打卡历史操作记录 (My Plant Care History Logs) */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">我的植株历史操作记录 ({myLogs.length})</h3>
              <p className="text-[10px] text-gray-400">我和协同人员对名下植株的所有养护打卡全记录</p>
            </div>
          </div>
          {onQuickLog && (
            <button
              onClick={() => onQuickLog(myPlantIds[0])}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              记一笔打卡
            </button>
          )}
        </div>

        {myLogs.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs text-gray-500 font-medium">暂无相关的历史养护打卡记录</p>
            <p className="text-[11px] text-gray-400">对名下植物进行浇水、施肥或拍照打卡后，操作轨迹将自动同步归档在此处</p>
            {onQuickLog && (
              <button
                onClick={() => onQuickLog(myPlantIds[0])}
                className="mt-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                给植物记一笔打卡
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {myLogs.map(log => {
              const associatedPlantCodes = log.plantIds
                ? log.plantIds.map(pid => {
                    const p = plants.find(plant => plant.id === pid || String(plant.id) === String(pid) || plant.code === String(pid));
                    if (p) return p.code;
                    if (typeof pid === 'string' && String(pid).startsWith('辣椒')) return String(pid);
                    const num = parseInt(String(pid).replace(/\D/g, ''), 10);
                    return !isNaN(num) ? `辣椒 #${num < 10 ? '0' + num : num}` : `辣椒 #${pid}`;
                  }).filter(Boolean).join('、')
                : '';

              return (
                <div
                  key={log.id}
                  className="bg-emerald-50/30 hover:bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-2xs"
                >
                  {/* Log Card Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{log.actionIcon || '📝'}</span>
                      <span className="font-black text-gray-900">{log.actionType}</span>
                      {associatedPlantCodes && (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                          {associatedPlantCodes}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {new Date(log.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Operator and details */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-gray-500">打卡人：</span>
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded-md text-[11px]">
                        👤 {log.userName}
                      </span>
                      {log.waterVolume && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-semibold">
                          💧 水量: {log.waterVolume}
                        </span>
                      )}
                      {log.fertilizerName && (
                        <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md font-semibold">
                          🧪 {log.fertilizerName} ({log.fertilizerConcentration || '默认'})
                        </span>
                      )}
                    </div>

                    {log.notes && (
                      <p className="text-gray-700 bg-white p-2 rounded-xl border border-gray-100 text-xs italic">
                        “{log.notes}”
                      </p>
                    )}
                  </div>

                  {/* Photo thumbnail */}
                  {log.photo && (
                    <div className="pt-1">
                      <div
                        className="relative group cursor-pointer inline-block"
                        onClick={() => onPreviewImage?.(log.photo!, `打卡记录照片 - ${log.actionType}`)}
                      >
                        <img
                          src={log.photo}
                          alt={log.actionType}
                          className="w-20 h-20 rounded-xl object-cover border border-emerald-200 group-hover:scale-105 transition-all shadow-xs"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                          点击放大
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedQrPlant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-extrabold text-gray-900 text-base">{selectedQrPlant.code} 专属二维码</span>
              <button
                onClick={() => setSelectedQrPlant(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl inline-block border border-emerald-100 shadow-inner">
              <QRCodeSVG
                value={getPlantQrUrl(selectedQrPlant.id)}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">
                归属状态：{selectedQrPlant.claimed ? `【${selectedQrPlant.ownerName}】名下` : '【待扫码认领】'}
              </p>
              <p className="text-[11px] text-gray-400">
                扫此码直接打开 {selectedQrPlant.code} 档案卡并可以快捷记录养护。
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  onOpenPlantDetail(selectedQrPlant.id);
                  setSelectedQrPlant(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                查看植株档案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
