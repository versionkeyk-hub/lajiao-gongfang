import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { 
  Users, 
  QrCode, 
  PlusCircle, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  Printer, 
  Search, 
  RefreshCw, 
  Key, 
  CheckSquare, 
  Square,
  Sparkles,
  Unlink,
  CheckCircle2,
  X,
  Eye,
  RotateCcw,
  ArchiveRestore,
  Database,
  Filter,
  Plus,
  Edit3,
  Save,
  FileText,
  Upload,
  Droplets,
  Sprout,
  Scissors,
  MapPin,
  Camera,
  Sun
} from 'lucide-react';
import { Plant, UserProfile, CareLog, SystemConfig, SystemActionTypeConfig } from '../types';
import { 
  fetchUsers, 
  adminBanUser, 
  adminDeleteUser, 
  adminResetUserPassword,
  adminBatchCreatePlants, 
  adminDeletePlant, 
  adminUnclaimPlant,
  adminRecyclePlant,
  adminRestorePlant,
  adminResetPlant,
  fetchRecycleBinPlants,
  fetchLogs,
  updatePlant,
  adminCreateSinglePlant,
  adminCreateUser,
  adminUpdateUser,
  adminCreateCareLog,
  adminUpdateCareLog,
  adminDeleteCareLog,
  addOrUpdateActionType,
  deleteActionType,
  updateSystemConfig
} from '../lib/api';

interface AdminConsoleProps {
  plants: Plant[];
  onRefreshData: () => void;
  onSelectPlant: (plant: Plant) => void;
  onPreviewImage?: (url: string, title?: string) => void;
  systemConfig?: SystemConfig | null;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  plants,
  onRefreshData,
  onSelectPlant,
  onPreviewImage,
  systemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'USERS' | 'PLANTS' | 'RECYCLE' | 'PRINT'>('FIELDS');
  const [fieldCategory, setFieldCategory] = useState<'PLANTS' | 'LOGS' | 'USERS' | 'ACTION_CONFIG'>('ACTION_CONFIG');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // System Config State
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(systemConfig || null);
  useEffect(() => {
    if (systemConfig) setSysConfig(systemConfig);
  }, [systemConfig]);

  // Action Type Edit/Create Modal
  const [actionTypeModal, setActionTypeModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    formData: Partial<SystemActionTypeConfig>;
  } | null>(null);

  // New Dict Tag Inputs
  const [newGrowthStageTag, setNewGrowthStageTag] = useState('');
  const [newHealthStatusTag, setNewHealthStatusTag] = useState('');
  const [newLocationTag, setNewLocationTag] = useState('');
  const [newFertilizerTag, setNewFertilizerTag] = useState('');

  // Care Logs state for full field manager
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchFieldKeyword, setSearchFieldKeyword] = useState('');

  // Universal Full Field Edit/Create Modal state
  const [fullFieldModal, setFullFieldModal] = useState<{
    isOpen: boolean;
    category: 'PLANTS' | 'LOGS' | 'USERS';
    isNew: boolean;
    formData: any;
  } | null>(null);
  
  // Recycle Bin Plants state
  const [trashPlants, setTrashPlants] = useState<Plant[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);

  // Batch plant creation form state
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchPrefix, setBatchPrefix] = useState('辣椒');
  const [batchLocation, setBatchLocation] = useState('技术部办公区');
  const [customLocation, setCustomLocation] = useState('');
  const [creatingPlants, setCreatingPlants] = useState(false);

  // Selected plants for QR code download
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [plantSearch, setPlantSearch] = useState('');
  
  // Modal for previewing single QR code
  const [qrModalPlant, setQrModalPlant] = useState<Plant | null>(null);

  // Canvas refs for downloading PNGs
  const qrCanvasRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const fetched = await fetchUsers();
      setUsers(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAllLogs = async () => {
    setLoadingLogs(true);
    try {
      const fetched = await fetchLogs();
      setLogs(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadRecycleBin = async () => {
    setLoadingTrash(true);
    try {
      const fetched = await fetchRecycleBinPlants();
      setTrashPlants(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
    loadAllLogs();
    loadRecycleBin();
  }, []);

  // System Config Handlers
  const handleSaveActionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTypeModal?.formData.label?.trim()) {
      alert('请输入操作动作名称（例如：虫害防治）');
      return;
    }
    try {
      const updatedConfig = await addOrUpdateActionType(actionTypeModal.formData);
      setSysConfig(updatedConfig);
      setActionTypeModal(null);
      alert('已成功保存全局操作动作字段配置！');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleDeleteActionType = async (id: string, label: string) => {
    if (!confirm(`确定要删除操作动作【${label}】吗？删去后前台打卡选项中将不再出现该动作。`)) return;
    try {
      const updatedConfig = await deleteActionType(id);
      setSysConfig(updatedConfig);
      alert(`已成功删除操作动作【${label}】`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleAddDictTag = async (field: 'growthStages' | 'healthStatuses' | 'locations' | 'commonFertilizers', value: string) => {
    if (!value.trim()) return;
    const currentList = sysConfig?.[field] || [];
    if (currentList.includes(value.trim())) {
      alert('该字典项已存在');
      return;
    }
    const baseConfig = sysConfig || {
      growthStages: ['芽苗期', '幼苗期', '生长期', '花蕾期', '挂果期', '采收期'],
      healthStatuses: ['茁壮成长', '需要浇水', '需要施肥', '观察中', '病虫害防护'],
      locations: ['技术部办公区', '财务办公区', '大厅展现区', '直播间', '自媒体办公区'],
      commonFertilizers: ['磷酸二氢钾', '通用型复合肥', '水溶育苗肥', '羊粪有机肥'],
      actionTypes: []
    };
    const updated = {
      ...baseConfig,
      [field]: [...currentList, value.trim()]
    };
    try {
      const result = await updateSystemConfig(updated as SystemConfig);
      setSysConfig(result);
      if (field === 'growthStages') setNewGrowthStageTag('');
      if (field === 'healthStatuses') setNewHealthStatusTag('');
      if (field === 'locations') setNewLocationTag('');
      if (field === 'commonFertilizers') setNewFertilizerTag('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '更新字典失败');
    }
  };

  const handleRemoveDictTag = async (field: 'growthStages' | 'healthStatuses' | 'locations' | 'commonFertilizers', value: string) => {
    const currentList = sysConfig?.[field] || [];
    const updatedList = currentList.filter(item => item !== value);
    const baseConfig = sysConfig || {
      growthStages: ['芽苗期', '幼苗期', '生长期', '花蕾期', '挂果期', '采收期'],
      healthStatuses: ['茁壮成长', '需要浇水', '需要施肥', '观察中', '病虫害防护'],
      locations: ['技术部办公区', '财务办公区', '大厅展现区', '直播间', '自媒体办公区'],
      commonFertilizers: ['磷酸二氢钾', '通用型复合肥', '水溶育苗肥', '羊粪有机肥'],
      actionTypes: []
    };
    const updated = {
      ...baseConfig,
      [field]: updatedList
    };
    try {
      const result = await updateSystemConfig(updated as SystemConfig);
      setSysConfig(result);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '移除字典项失败');
    }
  };

  // Open full field editor for existing or new record
  const openEditModal = (category: 'PLANTS' | 'LOGS' | 'USERS', record?: any) => {
    if (record) {
      setFullFieldModal({
        isOpen: true,
        category,
        isNew: false,
        formData: { ...record }
      });
    } else {
      let defaultData: any = {};
      if (category === 'PLANTS') {
        defaultData = {
          code: `辣椒 #${plants.length + 1 < 10 ? '0' + (plants.length + 1) : plants.length + 1}`,
          name: `辣椒 #${plants.length + 1 < 10 ? '0' + (plants.length + 1) : plants.length + 1}`,
          claimed: false,
          ownerName: '',
          owners: [],
          primaryDept: '技术部办公区',
          location: '技术部办公区',
          status: '芽苗期',
          health: '茁壮成长',
          plantedDate: new Date().toISOString().split('T')[0],
          notes: '',
          careCount: 0,
          avatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
          initialAvatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80'
        };
      } else if (category === 'LOGS') {
        defaultData = {
          plantIds: [1],
          userName: '管理员',
          userId: 'u-admin',
          userDept: '管理部',
          userLocation: '办公区',
          actionType: '浇水',
          waterVolume: '',
          fertilizerName: '',
          fertilizerConcentration: '',
          locationNew: '',
          photo: '',
          notes: '',
          createdAt: new Date().toLocaleString('zh-CN')
        };
      } else if (category === 'USERS') {
        defaultData = {
          name: '',
          password: '123',
          dept: '技术部',
          location: '办公区',
          role: 'user',
          plantIds: [],
          isBanned: false,
          avatar: ''
        };
      }

      setFullFieldModal({
        isOpen: true,
        category,
        isNew: true,
        formData: defaultData
      });
    }
  };

  // Save Full Field Modal Form
  const handleSaveFullFields = async () => {
    if (!fullFieldModal) return;
    const { category, isNew, formData } = fullFieldModal;

    try {
      if (category === 'PLANTS') {
        if (!formData.code && !formData.name) {
          alert('请填写植株编号或名称');
          return;
        }
        if (isNew) {
          await adminCreateSinglePlant(formData);
        } else {
          await updatePlant(formData.id, formData);
        }
      } else if (category === 'LOGS') {
        if (!formData.userName) {
          alert('请填写打卡记录人姓名');
          return;
        }
        if (typeof formData.plantIds === 'string') {
          formData.plantIds = formData.plantIds
            .split(/[,，]/)
            .map((s: string) => parseInt(s.trim()))
            .filter((n: number) => !isNaN(n));
        }
        if (isNew) {
          await adminCreateCareLog(formData);
        } else {
          await adminUpdateCareLog(formData.id, formData);
        }
      } else if (category === 'USERS') {
        if (!formData.name) {
          alert('请填写成员姓名');
          return;
        }
        if (typeof formData.plantIds === 'string') {
          formData.plantIds = formData.plantIds
            .split(/[,，]/)
            .map((s: string) => parseInt(s.trim()))
            .filter((n: number) => !isNaN(n));
        }
        if (isNew) {
          await adminCreateUser(formData);
        } else {
          await adminUpdateUser(formData.id, formData);
        }
      }

      alert(isNew ? '创建成功！' : '全字段数据保存成功！');
      setFullFieldModal(null);
      loadAllUsers();
      loadAllLogs();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '保存失败，请稍后再试');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('确定要删除这条养护日志吗？删除后不可恢复。')) return;
    try {
      await adminDeleteCareLog(logId);
      alert('已成功删除日志');
      loadAllLogs();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.location && u.location.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // Filter plants
  const filteredPlants = plants.filter(p =>
    p.code.toLowerCase().includes(plantSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(plantSearch.toLowerCase()) ||
    (p.ownerName && p.ownerName.toLowerCase().includes(plantSearch.toLowerCase()))
  );

  // Handle Ban / Unban User
  const handleToggleBan = async (user: UserProfile) => {
    const actionText = user.isBanned ? '解封' : '封禁';
    if (!confirm(`确定要${actionText}成员【${user.name}】吗？`)) return;
    try {
      await adminBanUser(user.id, !user.isBanned);
      await loadAllUsers();
      alert(`已成功${actionText}【${user.name}】`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // Handle Reset User Password
  const handleResetPassword = async (user: UserProfile) => {
    const newPwd = window.prompt(`请输入要为成员【${user.name}】重置的新密码（留空则默认设为 888888）：`, '888888');
    if (newPwd === null) return;
    try {
      const res = await adminResetUserPassword(user.id, newPwd.trim() || '888888');
      alert(res.message || `已为成员【${user.name}】重置密码`);
      await loadAllUsers();
    } catch (err: any) {
      alert(err.message || '重置密码失败');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`警告：确定要删除成员【${user.name}】吗？该成员领用的植物将被释放回未认领状态。`)) return;
    try {
      await adminDeleteUser(user.id);
      await loadAllUsers();
      onRefreshData();
      alert(`已成功注销成员【${user.name}】`);
    } catch (err: any) {
      alert(err.message || '注销失败');
    }
  };

  // Handle Batch Plant Creation
  const handleCreatePlants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchCount < 1 || batchCount > 50) {
      alert('请填入 1 ~ 50 之间的增加数量');
      return;
    }
    const finalLoc = batchLocation === '自定义...' ? customLocation.trim() || '养护区域' : batchLocation;
    
    setCreatingPlants(true);
    try {
      await adminBatchCreatePlants({
        count: batchCount,
        prefix: batchPrefix.trim() || '辣椒',
        location: finalLoc,
        status: '芽苗期',
        health: '茁壮成长'
      });
      onRefreshData();
      alert(`成功新增 ${batchCount} 盆植物及其专属二维码！`);
    } catch (err: any) {
      alert(err.message || '创建失败');
    } finally {
      setCreatingPlants(false);
    }
  };

  // Handle Unclaim Plant
  const handleUnclaim = async (plant: Plant) => {
    if (!confirm(`确定要解绑 ${plant.code} 的领用者【${plant.ownerName}】吗？`)) return;
    try {
      await adminUnclaimPlant(plant.id);
      onRefreshData();
      alert(`已解绑 ${plant.code}`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // Handle Move Plant to Trash / Recycle Bin
  const handleRecyclePlant = async (plant: Plant) => {
    if (!confirm(`确定要把 ${plant.code} 存入垃圾桶吗？您可以在【垃圾桶】中随时进行恢复。`)) return;
    try {
      await adminRecyclePlant(plant.id);
      onRefreshData();
      await loadRecycleBin();
      alert(`已将 ${plant.code} 存入垃圾桶`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // Handle Reset Plant to Initial State
  const handleResetPlant = async (plant: Plant) => {
    if (!confirm(`确定要重置 ${plant.code} 为初始状态吗？重置后将清除领用者信息、记录与自定义照片，恢复为初始芽苗。`)) return;
    try {
      await adminResetPlant(plant.id);
      onRefreshData();
      alert(`已成功将 ${plant.code} 重置为初始状态！`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // Handle Restore Plant from Trash
  const handleRestorePlant = async (plant: Plant) => {
    try {
      await adminRestorePlant(plant.id);
      onRefreshData();
      await loadRecycleBin();
      alert(`已成功恢复 ${plant.code}！`);
    } catch (err: any) {
      alert(err.message || '恢复失败');
    }
  };

  // Handle Permanent Delete Plant
  const handlePermanentDeletePlant = async (plant: Plant) => {
    if (!confirm(`警告：彻底删除 ${plant.code} 后将无法找回！确定继续吗？`)) return;
    try {
      await adminDeletePlant(plant.id);
      await loadRecycleBin();
      onRefreshData();
      alert(`已永久彻底删除 ${plant.code}`);
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  // Selection toggles
  const toggleSelectAll = () => {
    if (selectedPlantIds.length === filteredPlants.length) {
      setSelectedPlantIds([]);
    } else {
      setSelectedPlantIds(filteredPlants.map(p => p.id));
    }
  };

  const toggleSelectPlant = (id: number) => {
    if (selectedPlantIds.includes(id)) {
      setSelectedPlantIds(selectedPlantIds.filter(i => i !== id));
    } else {
      setSelectedPlantIds([...selectedPlantIds, id]);
    }
  };

  // Batch download PNG QR codes
  const handleDownloadSingleQR = (plant: Plant) => {
    const container = qrCanvasRefs.current[plant.id];
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Create a styled canvas with header text
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    exportCanvas.width = 360;
    exportCanvas.height = 440;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 360, 440);

    // Border
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 344, 424);

    // Header title
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(plant.code, 180, 45);

    ctx.fillStyle = '#4b5563';
    ctx.font = '14px sans-serif';
    ctx.fillText('领用/打卡专属植物二维码', 180, 72);

    // Draw QR Code image onto center
    ctx.drawImage(canvas, 55, 95, 250, 250);

    // Footer info
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 15px sans-serif';
    const statusText = plant.claimed ? `归属: ${plant.ownerName}` : '扫码认领 / 登记开启';
    ctx.fillText(statusText, 180, 375);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('内部养护团队专用 • 随时扫码即刻记录', 180, 405);

    // Trigger download
    const link = document.createElement('a');
    link.download = `${plant.code}_二维码.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Batch download selected QR codes
  const handleBatchDownload = async () => {
    const targetIds = selectedPlantIds.length > 0 ? selectedPlantIds : filteredPlants.map(p => p.id);
    if (targetIds.length === 0) {
      alert('请先选择要下载二维码的植物');
      return;
    }

    alert(`准备开始下载 ${targetIds.length} 个二维码图片，浏览器可能会提示多文件下载许可，请点击“允许”。`);

    for (const id of targetIds) {
      const plant = plants.find(p => p.id === id);
      if (plant) {
        handleDownloadSingleQR(plant);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 backdrop-blur border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-2xl font-bold">
              👑
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-100 flex items-center gap-2">
                管理员控制后台
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  全权管理模式
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                管理成员账号、批量生成/重置植物专属二维码、回收站垃圾桶与恢复
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadAllUsers();
                loadRecycleBin();
                onRefreshData();
              }}
              className="flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-100 text-xs px-3 py-2 rounded-xl border border-emerald-500/40 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新全局数据
            </button>
          </div>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5 border-t border-emerald-700/60 pt-4">
          <button
            onClick={() => setActiveTab('FIELDS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'FIELDS'
                ? 'bg-amber-500 text-white shadow'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            <Database className="w-4 h-4" />
            🏷️ 全字段修改与新增中心
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'USERS'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            成员账号管理 ({users.length}人)
          </button>

          <button
            onClick={() => setActiveTab('PLANTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'PLANTS'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            植物与二维码 ({plants.length}盆)
          </button>

          <button
            onClick={() => setActiveTab('RECYCLE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'RECYCLE'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            垃圾桶 / 废纸篓 ({trashPlants.length})
          </button>

          <button
            onClick={() => setActiveTab('PRINT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'PRINT'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            标签纸打印排版
          </button>
        </div>
      </div>

      {/* TAB 0: ALL FIELDS CONTROL & EDITING CENTER */}
      {activeTab === 'FIELDS' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 space-y-5">
          {/* Top Bar with Category Filter & Search & Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1 shrink-0">
                <Filter className="w-4 h-4 text-amber-600" />
                字段类别筛选：
              </span>
              <div className="flex bg-amber-100/70 p-1 rounded-xl gap-1 flex-wrap">
                <button
                  onClick={() => setFieldCategory('ACTION_CONFIG')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    fieldCategory === 'ACTION_CONFIG' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  ⚙️ 应用操作动作与字典配置
                </button>
                <button
                  onClick={() => setFieldCategory('PLANTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    fieldCategory === 'PLANTS' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  🪴 植株档案全字段 ({plants.length})
                </button>
                <button
                  onClick={() => setFieldCategory('LOGS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    fieldCategory === 'LOGS' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  📜 养护日志全字段 ({logs.length})
                </button>
                <button
                  onClick={() => setFieldCategory('USERS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    fieldCategory === 'USERS' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  👥 用户账号全字段 ({users.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFieldKeyword}
                  onChange={(e) => setSearchFieldKeyword(e.target.value)}
                  placeholder="搜索字段内容..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-200 text-xs rounded-xl outline-none focus:border-amber-500 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  if (fieldCategory !== 'ACTION_CONFIG') {
                    openEditModal(fieldCategory);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                新增 {fieldCategory === 'PLANTS' ? '植株档案' : fieldCategory === 'LOGS' ? '养护日志' : '成员账号'}
              </button>
            </div>
          </div>

          {/* CATEGORY 0: ACTION CONFIG & SYSTEM DICTIONARIES */}
          {fieldCategory === 'ACTION_CONFIG' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl text-lg font-bold">
                  ⚙️
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-950 text-sm">全局操作动作与系统字典设置</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    在这里可以灵活修改或新增对<strong>整个应用程序</strong>生效的护理操作字段（如：浇水、施肥、叶面肥、松土、打顶剪枝、位置变更、成长拍照、所有权转移、虫害防治、病害防治、补光、换盆等），并可开启/关闭特定操作的高级表单输入（如手写浇水量、肥料配比）。修改后全员实时同步！
                  </p>
                </div>
              </div>

              {/* Action Fields Grid */}
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span>🛠️ 全局应用护理操作字段字典</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        共 {sysConfig?.actionTypes?.length || 0} 个操作动作
                      </span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">控制前台“记一笔”护理日志弹窗中的操作图标与表单输入项</p>
                  </div>
                  <button
                    onClick={() => setActionTypeModal({
                      isOpen: true,
                      isNew: true,
                      formData: {
                        id: `act-${Date.now()}`,
                        label: '',
                        icon: '🐛',
                        colorBg: 'bg-purple-50 hover:bg-purple-100',
                        colorText: 'text-purple-700',
                        enableWaterInput: false,
                        enableFertilizerInput: false,
                        enableLocationInput: false,
                        description: ''
                      }
                    })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    新增操作动作字段 (如：虫害防治)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(sysConfig?.actionTypes || []).map(action => (
                    <div key={action.id} className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs hover:border-emerald-300 transition-all space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-xl ${action.colorBg || 'bg-gray-100'} text-lg flex items-center justify-center`}>
                            {action.icon}
                          </span>
                          <div>
                            <span className={`font-bold text-sm ${action.colorText || 'text-gray-900'}`}>{action.label || action.key || '未命名动作'}</span>
                            <span className="block text-[10px] text-gray-400 font-mono">ID: {action.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActionTypeModal({
                              isOpen: true,
                              isNew: false,
                              formData: { ...action }
                            })}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="修改动作设置"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteActionType(action.id, action.label)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="删除动作"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {action.enableWaterInput && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                            💧 包含手写浇水说明
                          </span>
                        )}
                        {action.enableFertilizerInput && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium border border-amber-100">
                            ✨ 包含肥料与浓度配比
                          </span>
                        )}
                        {action.enableLocationInput && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-medium border border-rose-100">
                            📍 包含养护新位置选择
                          </span>
                        )}
                        {!action.enableWaterInput && !action.enableFertilizerInput && !action.enableLocationInput && (
                          <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md font-medium border border-gray-100">
                            📝 基础打卡(图片+备注)
                          </span>
                        )}
                      </div>

                      {action.description && (
                        <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg truncate">
                          {action.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* System Dictionary Tags Grid (Growth Stages, Health, Locations, Fertilizers) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Growth Stages */}
                <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-3">
                  <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    🌱 植株“生长阶段”字典列表
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(sysConfig?.growthStages || []).map(stage => (
                      <span key={stage} className="bg-white border border-amber-300 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                        <span>{stage}</span>
                        <button onClick={() => handleRemoveDictTag('growthStages', stage)} className="hover:text-rose-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newGrowthStageTag}
                      onChange={(e) => setNewGrowthStageTag(e.target.value)}
                      placeholder="新增阶段（如：盛果期）"
                      className="flex-1 bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={() => handleAddDictTag('growthStages', newGrowthStageTag)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                    >
                      新增
                    </button>
                  </div>
                </div>

                {/* 2. Health Statuses */}
                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-3">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    💚 植株“健康状况”字典列表
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(sysConfig?.healthStatuses || []).map(status => (
                      <span key={status} className="bg-white border border-emerald-300 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                        <span>{status}</span>
                        <button onClick={() => handleRemoveDictTag('healthStatuses', status)} className="hover:text-rose-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newHealthStatusTag}
                      onChange={(e) => setNewHealthStatusTag(e.target.value)}
                      placeholder="新增健康状况（如：隔离防治中）"
                      className="flex-1 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={() => handleAddDictTag('healthStatuses', newHealthStatusTag)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                    >
                      新增
                    </button>
                  </div>
                </div>

                {/* 3. Locations */}
                <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200 space-y-3">
                  <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                    📍 默认“摆放与养护区域”字典
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(sysConfig?.locations || []).map(loc => (
                      <span key={loc} className="bg-white border border-rose-300 text-rose-900 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                        <span>{loc}</span>
                        <button onClick={() => handleRemoveDictTag('locations', loc)} className="hover:text-rose-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newLocationTag}
                      onChange={(e) => setNewLocationTag(e.target.value)}
                      placeholder="新增位置（如：阳光暖棚）"
                      className="flex-1 bg-white border border-rose-300 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={() => handleAddDictTag('locations', newLocationTag)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                    >
                      新增
                    </button>
                  </div>
                </div>

                {/* 4. Common Fertilizers */}
                <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200 space-y-3">
                  <h4 className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    🧪 常用“肥料与药剂名称”字典
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {((sysConfig as any)?.commonFertilizers || sysConfig?.fertilizers || []).map((fert: string) => (
                      <span key={fert} className="bg-white border border-purple-300 text-purple-900 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                        <span>{fert}</span>
                        <button onClick={() => handleRemoveDictTag('commonFertilizers' as any, fert)} className="hover:text-rose-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newFertilizerTag}
                      onChange={(e) => setNewFertilizerTag(e.target.value)}
                      placeholder="新增肥料/药剂（如：阿维菌素）"
                      className="flex-1 bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={() => handleAddDictTag('commonFertilizers', newFertilizerTag)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                    >
                      新增
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 1: PLANTS FULL FIELDS LIST */}
          {fieldCategory === 'PLANTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>提示：点击任意植株卡片上的“✏️ 修改全字段”按钮，即可自由修改所有属性</span>
                <span>共计 {plants.length} 盆植株</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plants
                  .filter(p => !searchFieldKeyword || p.code.toLowerCase().includes(searchFieldKeyword.toLowerCase()) || p.name.toLowerCase().includes(searchFieldKeyword.toLowerCase()) || (p.ownerName && p.ownerName.includes(searchFieldKeyword)))
                  .map(plant => (
                    <div key={plant.id} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 hover:border-emerald-300 transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={plant.avatar}
                            alt={plant.name}
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shadow-xs cursor-pointer"
                            onClick={() => onPreviewImage && onPreviewImage(plant.avatar, plant.code)}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-gray-900">{plant.code}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                plant.claimed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {plant.claimed ? `归属: ${plant.ownerName}` : '待领用'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              部门: {plant.primaryDept || '未指定'} • 位置: {plant.location || '办公区'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openEditModal('PLANTS', plant)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          修改全字段
                        </button>
                      </div>

                      {/* Details pills grid */}
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-white p-2.5 rounded-xl border border-gray-100">
                        <div><span className="text-gray-400">生长阶段:</span> <span className="font-bold text-gray-800">{plant.status}</span></div>
                        <div><span className="text-gray-400">健康状况:</span> <span className="font-bold text-emerald-700">{plant.health}</span></div>
                        <div><span className="text-gray-400">打卡次数:</span> <span className="font-bold text-amber-600">{plant.careCount ?? 0}次</span></div>
                        <div><span className="text-gray-400">播种/领用:</span> <span className="font-medium text-gray-700">{plant.plantedDate || '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-400">备注:</span> <span className="font-medium text-gray-700 truncate block">{plant.notes || '无特别备注'}</span></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* CATEGORY 2: CARE LOGS FULL FIELDS LIST */}
          {fieldCategory === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>提示：养护日志支持手动输入浇水描述，所有字段均可在后台直接改动</span>
                <span>共计 {logs.length} 条养护记录</span>
              </div>

              {loadingLogs ? (
                <div className="text-center py-8 text-xs text-gray-400">加载养护日志数据中...</div>
              ) : (
                <div className="space-y-2.5">
                  {logs
                    .filter(l => !searchFieldKeyword || l.userName.includes(searchFieldKeyword) || l.actionType.includes(searchFieldKeyword) || (l.notes && l.notes.includes(searchFieldKeyword)))
                    .map(log => (
                      <div key={log.id} className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-200/80 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0 font-bold">
                            {log.actionIcon || '💧'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-gray-900">{log.userName}</span>
                              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {log.actionType}
                              </span>
                              {log.waterVolume && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  💧 {log.waterVolume}
                                </span>
                              )}
                              {log.fertilizerName && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  ✨ {log.fertilizerName} ({log.fertilizerConcentration || '默认'})
                                </span>
                              )}
                              <span className="text-[11px] text-gray-400">{log.createdAt}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              关联植株: <span className="font-bold text-emerald-700">
                                {Array.isArray(log.plantIds)
                                  ? log.plantIds.map(pid => {
                                      const p = plants.find(plant => plant.id === pid || String(plant.id) === String(pid) || plant.code === String(pid));
                                      return p ? p.code : `辣椒 #${pid}`;
                                    }).join('、')
                                  : log.plantIds}
                              </span>
                              {log.notes && <span className="ml-2 text-gray-500">“{log.notes}”</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {log.photo && (
                            <button
                              onClick={() => onPreviewImage && onPreviewImage(log.photo!, `${log.userName} 的${log.actionType}照片`)}
                              className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1"
                            >
                              📷 查看照片
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal('LOGS', log)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            修改全字段
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORY 3: USER PROFILES FULL FIELDS LIST */}
          {fieldCategory === 'USERS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>提示：可自由修改成员姓名、部门、所属工位、密码、关联植株与封禁状态</span>
                <span>共计 {users.length} 名成员</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users
                  .filter(u => !searchFieldKeyword || u.name.includes(searchFieldKeyword) || (u.dept && u.dept.includes(searchFieldKeyword)))
                  .map(user => (
                    <div key={user.id} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-emerald-200">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name[0]
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-gray-900">{user.name}</span>
                            {user.isAdmin && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.2 rounded-full font-extrabold">管理员</span>}
                            {user.isBanned && <span className="bg-rose-600 text-white text-[10px] px-2 py-0.2 rounded-full font-extrabold">已封禁</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            部门: {user.dept || '无'} • 区域: {user.location || '办公区'} • 密码: <span className="font-mono text-gray-700">{user.password || '******'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openEditModal('USERS', user)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        修改全字段
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                内部成员账号与状态管理
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                可帮助成员重置密码、修改封禁状态、注销变动人员账号（注销后关联植株自动释放）
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜索成员姓名..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-56"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
              正在加载成员信息...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              未找到匹配的成员账号
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map(user => {
                const userPlants = plants.filter(p => p.ownerName === user.name || p.owners.includes(user.name));
                const isSystemAdmin = user.name.toLowerCase() === 'admin' || user.isAdmin;

                return (
                  <div
                    key={user.id}
                    className={`p-4 rounded-xl border transition ${
                      user.isBanned
                        ? 'bg-rose-50/50 border-rose-200'
                        : isSystemAdmin
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/30 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => onPreviewImage?.(user.avatar!, `${user.name} 头像`)}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                            {user.name[0]}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                            {isSystemAdmin && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                👑 管理员
                              </span>
                            )}
                            {user.isBanned && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                <ShieldAlert className="w-3 h-3" /> 已封禁
                              </span>
                            )}
                            {!isSystemAdmin && !user.isBanned && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                                🟢 正常
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>养在: {user.location || '养护区域'}</span>
                          </div>

                          <div className="text-[11px] text-gray-400 mt-1">
                            已认领植物: {userPlants.length > 0 ? userPlants.map(p => p.code).join(', ') : '暂无'}
                          </div>
                        </div>
                      </div>

                      {/* User Actions */}
                      {!isSystemAdmin && (
                        <div className="flex flex-col gap-1.5 items-end">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 transition border border-amber-200/60"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" /> 重置密码
                          </button>

                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                              user.isBanned
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {user.isBanned ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" /> 解封账号
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" /> 封禁账号
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-xs px-2.5 py-1 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 font-medium flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 注销账号
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLANTS & QR MANAGEMENT */}
      {activeTab === 'PLANTS' && (
        <div className="space-y-6">
          {/* Form to Batch Add Plants */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              批量新增植物档案与专属二维码
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              可根据需求一次性批量新增植物，系统将自动依次编号并生成不可重复的绑定二维码
            </p>

            <form onSubmit={handleCreatePlants} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">新增数量 (盆)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCount}
                  onChange={e => setBatchCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">植物前缀</label>
                <input
                  type="text"
                  value={batchPrefix}
                  onChange={e => setBatchPrefix(e.target.value)}
                  placeholder="如：辣椒"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">放置区域</label>
                <select
                  value={batchLocation}
                  onChange={e => setBatchLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="技术部办公区">技术部办公区</option>
                  <option value="财务办公区">财务办公区</option>
                  <option value="大厅">大厅</option>
                  <option value="直播间">直播间</option>
                  <option value="自媒体办公区">自媒体办公区</option>
                  <option value="人事办公室">人事办公室</option>
                  <option value="自定义...">自定义区域...</option>
                </select>
              </div>

              {batchLocation === '自定义...' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">自定义区域名称</label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    placeholder="请输入区域名称"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={creatingPlants}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {creatingPlants ? '生成中...' : `一键批量生成 ${batchCount} 盆`}
                </button>
              )}
            </form>
          </div>

          {/* Plant QR List & Batch Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  二维码明细、导出、重置与垃圾桶回收
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  可将植物放入垃圾桶或重置其信息为初始状态（重置后可重新认领，垃圾桶内可进行恢复）
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-1 transition"
                >
                  {selectedPlantIds.length === filteredPlants.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> 取消全选
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-gray-400" /> 全选 ({filteredPlants.length})
                    </>
                  )}
                </button>

                <button
                  onClick={handleBatchDownload}
                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  批量下载选中二维码 ({selectedPlantIds.length > 0 ? selectedPlantIds.length : filteredPlants.length})
                </button>
              </div>
            </div>

            {/* Grid of Plants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPlants.map(plant => {
                const qrUrl = `${appBaseUrl}/?plantId=${plant.id}`;
                const isSelected = selectedPlantIds.includes(plant.id);

                return (
                  <div
                    key={plant.id}
                    className={`p-4 rounded-xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-400 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    {/* Checkbox select */}
                    <button
                      onClick={() => toggleSelectPlant(plant.id)}
                      className="absolute top-3 left-3 z-10 text-emerald-600 hover:scale-110 transition"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
                    </button>

                    <div>
                      {/* Top Header */}
                      <div className="text-center pl-6 pr-2 mb-2">
                        <span className="font-bold text-emerald-800 text-sm block">{plant.code}</span>
                        <span className="text-[11px] text-gray-500">
                          {plant.claimed ? `归属: ${plant.ownerName}` : '⚪ 待扫码认领'}
                        </span>
                      </div>

                      {/* QR Code Graphic Canvas */}
                      <div
                        ref={el => { qrCanvasRefs.current[plant.id] = el; }}
                        onClick={() => setQrModalPlant(plant)}
                        className="bg-white p-3 rounded-xl border border-gray-100 shadow-inner flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition my-2 group"
                      >
                        <QRCodeCanvas
                          value={qrUrl}
                          size={130}
                          level="M"
                          includeMargin={true}
                        />
                        <span className="text-[10px] text-gray-400 group-hover:text-emerald-600 mt-1 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> 点击放大查看/扫码测试
                        </span>
                      </div>

                      {/* Location & Status */}
                      <div className="text-[11px] text-gray-500 space-y-0.5 text-center mt-2">
                        <div>养在: {plant.location}</div>
                        <div>阶段: {plant.status} • {plant.health}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => handleDownloadSingleQR(plant)}
                        className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5"
                        title="下载二维码"
                      >
                        <Download className="w-3 h-3" /> 下载
                      </button>

                      <button
                        onClick={() => handleResetPlant(plant)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
                        title="重置信息为初始状态"
                      >
                        <RotateCcw className="w-3 h-3" /> 重置
                      </button>

                      <button
                        onClick={() => handleRecyclePlant(plant)}
                        className="text-rose-500 hover:text-rose-700 font-medium flex items-center gap-0.5"
                        title="存入垃圾桶"
                      >
                        <Trash2 className="w-3 h-3" /> 垃圾桶
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECYCLE BIN / TRASH */}
      {activeTab === 'RECYCLE' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                垃圾桶 / 废纸篓
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                已移入垃圾桶的植物列表，点击【恢复植物】即可无损恢复至普通列表中
              </p>
            </div>

            <button
              onClick={loadRecycleBin}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 刷新回收站
            </button>
          </div>

          {loadingTrash ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
              加载垃圾桶数据中...
            </div>
          ) : trashPlants.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              🗑️ 垃圾桶内空空如也，暂无被删除的植物
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {trashPlants.map(plant => (
                <div
                  key={plant.id}
                  className="p-4 bg-rose-50/40 border border-rose-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={plant.avatar || plant.initialAvatar}
                      alt={plant.code}
                      className="w-12 h-12 rounded-xl object-cover border border-rose-200 grayscale opacity-75 cursor-pointer hover:grayscale-0 hover:opacity-100 transition-all"
                      onClick={() => onPreviewImage?.((plant as any).image || plant.avatar || plant.initialAvatar || '', `${plant.code} 照片`)}
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm line-through text-rose-900">
                        {plant.code}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        区域: {plant.location} • 归属: {plant.ownerName || '未认领'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRestorePlant(plant)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-2xs transition"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" /> 恢复
                    </button>

                    <button
                      onClick={() => handlePermanentDeletePlant(plant)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 彻底删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRINTABLE LAYOUT SHEET */}
      {activeTab === 'PRINT' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 space-y-6 print:p-0 print:border-none">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 print:hidden">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                二维码不干胶标签打印排版 (适合直接打印或截图)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                格式化3x4完美排版，点击“打印标签”即可直接使用系统打印机打在A4纸或贴纸上
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> 立即调用打印机打印
            </button>
          </div>

          {/* Printable Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            {plants.map(plant => {
              const qrUrl = `${appBaseUrl}/?plantId=${plant.id}`;
              return (
                <div
                  key={plant.id}
                  className="border-2 border-dashed border-emerald-400 p-4 rounded-xl text-center flex flex-col items-center justify-between bg-white print:border-solid print:border-gray-800"
                >
                  <div className="font-extrabold text-emerald-800 text-base mb-1">
                    {plant.code}
                  </div>
                  
                  <div className="bg-white p-2 rounded-lg border border-gray-200 my-1">
                    <QRCodeSVG value={qrUrl} size={110} level="M" />
                  </div>

                  <div className="text-[11px] font-bold text-emerald-700 mt-1">
                    {plant.claimed ? `领用人: ${plant.ownerName}` : '扫码认领此盆植物'}
                  </div>
                  <div className="text-[9px] text-gray-400">
                    养在: {plant.location} • 内部团队专属
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SINGLE QR PREVIEW MODAL */}
      {qrModalPlant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setQrModalPlant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
              专属二维码标牌
            </div>

            <h3 className="text-xl font-extrabold text-gray-800 mb-1">
              {qrModalPlant.code}
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              {qrModalPlant.claimed ? `当前归属: ${qrModalPlant.ownerName} (${qrModalPlant.location})` : '⚪ 当前处于【待认领】状态'}
            </p>

            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center my-4 shadow-inner">
              <QRCodeSVG
                value={`${appBaseUrl}/?plantId=${qrModalPlant.id}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-xs text-emerald-700 font-medium mb-5">
              手机打开摄像头或微信直接扫码，即可打开本程序并直接加载该植物档案
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadSingleQR(qrModalPlant)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> 下载高清晰度图片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL FULL FIELD EDIT / CREATE MODAL */}
      {fullFieldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-emerald-100 my-auto animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setFullFieldModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                {fullFieldModal.isNew ? '➕ 新增记录' : '✏️ 修改全字段数据'}
              </span>
              <span className="text-xs font-bold text-gray-400">
                数据类别：{fullFieldModal.category === 'PLANTS' ? '🪴 植株档案' : fullFieldModal.category === 'LOGS' ? '📜 养护日志' : '👥 用户账号'}
              </span>
            </div>

            <h3 className="text-lg font-black text-gray-900 mb-4">
              {fullFieldModal.isNew
                ? `新增${fullFieldModal.category === 'PLANTS' ? '植株档案' : fullFieldModal.category === 'LOGS' ? '养护打卡日志' : '成员账号'}`
                : `编辑 ${fullFieldModal.formData.code || fullFieldModal.formData.name || fullFieldModal.formData.userName || '数据'} 全字段`}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveFullFields();
              }}
              className="space-y-4 text-xs"
            >
              {/* PLANT FIELDS */}
              {fullFieldModal.category === 'PLANTS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">植株编号 (code)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.code || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, code: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">植株显示名称 (name)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.name || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, name: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">认领归属状态 (claimed)</label>
                    <select
                      value={fullFieldModal.formData.claimed ? 'true' : 'false'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, claimed: e.target.value === 'true' } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      <option value="false">⚪ 未认领（待领用）</option>
                      <option value="true">🟢 已认领（归属名下）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">责任领用人 (ownerName)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.ownerName || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, ownerName: e.target.value } })}
                      placeholder="如：张伟"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">责任部门 (primaryDept)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.primaryDept || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, primaryDept: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">摆放养护区域 (location)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.location || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, location: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">生长阶段 (status)</label>
                    <select
                      value={fullFieldModal.formData.status || '芽苗期'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, status: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      {['芽苗期', '幼苗期', '生长期', '花蕾期', '挂果期', '采收期', '休眠期'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">健康状况 (health)</label>
                    <select
                      value={fullFieldModal.formData.health || '茁壮成长'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, health: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      {['茁壮成长', '需要浇水', '需要施肥', '观察中', '病虫害防护'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">播种/领用日期 (plantedDate)</label>
                    <input
                      type="date"
                      value={fullFieldModal.formData.plantedDate || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, plantedDate: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">累计打卡次数 (careCount)</label>
                    <input
                      type="number"
                      value={fullFieldModal.formData.careCount ?? 0}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, careCount: parseInt(e.target.value) || 0 } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">属性备注 (notes)</label>
                    <textarea
                      rows={2}
                      value={fullFieldModal.formData.notes || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, notes: e.target.value } })}
                      placeholder="植株个性备注、特殊品类说明等"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">植株照片URL / 上传 (avatar)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={fullFieldModal.formData.avatar || ''}
                        onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, avatar: e.target.value } })}
                        placeholder="https://... 或点击选择文件上传"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                      />
                      <label className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" /> 上传
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFullFieldModal({
                                  ...fullFieldModal,
                                  formData: { ...fullFieldModal.formData, avatar: reader.result as string }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* CARE LOG FIELDS */}
              {fullFieldModal.category === 'LOGS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">记录人姓名 (userName)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.userName || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, userName: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">关联植株编号IDs (plantIds，如 1,2)</label>
                    <input
                      type="text"
                      value={Array.isArray(fullFieldModal.formData.plantIds) ? fullFieldModal.formData.plantIds.join(', ') : fullFieldModal.formData.plantIds || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, plantIds: e.target.value } })}
                      placeholder="如 1, 3"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">操作类型 (actionType)</label>
                    <select
                      value={fullFieldModal.formData.actionType || '浇水'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, actionType: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      {['浇水', '施肥', '叶面肥', '松土', '定植', '打药', '打顶剪枝', '位置变更', '成长拍照', '晒太阳', '所有权转移'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">手写浇水说明/描述 (waterVolume)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.waterVolume || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, waterVolume: e.target.value } })}
                      placeholder="如：浇透、湿润表土、微淋等"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">肥料名称 (fertilizerName)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.fertilizerName || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, fertilizerName: e.target.value } })}
                      placeholder="如：磷酸二氢钾"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">肥料浓度 (fertilizerConcentration)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.fertilizerConcentration || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, fertilizerConcentration: e.target.value } })}
                      placeholder="如：1:1000 稀释液"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">位置变更 (locationNew)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.locationNew || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, locationNew: e.target.value } })}
                      placeholder="如：技术部窗台"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">记录时间 (createdAt)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.createdAt || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, createdAt: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">日志笔记心得 (notes)</label>
                    <textarea
                      rows={2}
                      value={fullFieldModal.formData.notes || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, notes: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">现场照片 (photo)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={fullFieldModal.formData.photo || ''}
                        onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, photo: e.target.value } })}
                        placeholder="图片URL或选择文件上传"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                      />
                      <label className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" /> 上传照片
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFullFieldModal({
                                  ...fullFieldModal,
                                  formData: { ...fullFieldModal.formData, photo: reader.result as string }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* USER PROFILE FIELDS */}
              {fullFieldModal.category === 'USERS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">成员姓名 (name)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.name || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, name: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">登录密码 (password)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.password || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, password: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">所属部门 (dept)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.dept || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, dept: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">办公区域/工位 (location)</label>
                    <input
                      type="text"
                      value={fullFieldModal.formData.location || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, location: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">角色权限 (isAdmin)</label>
                    <select
                      value={fullFieldModal.formData.isAdmin ? 'true' : 'false'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, isAdmin: e.target.value === 'true' } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      <option value="false">普通成员</option>
                      <option value="true">👑 系统管理员</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">账号状态 (isBanned)</label>
                    <select
                      value={fullFieldModal.formData.isBanned ? 'true' : 'false'}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, isBanned: e.target.value === 'true' } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    >
                      <option value="false">🟢 正常启用</option>
                      <option value="true">⛔ 封禁停用</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">绑定植株IDs (plantIds，如 1, 5, 8)</label>
                    <input
                      type="text"
                      value={Array.isArray(fullFieldModal.formData.plantIds) ? fullFieldModal.formData.plantIds.join(', ') : fullFieldModal.formData.plantIds || ''}
                      onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, plantIds: e.target.value } })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">个人头像 (avatar)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={fullFieldModal.formData.avatar || ''}
                        onChange={(e) => setFullFieldModal({ ...fullFieldModal, formData: { ...fullFieldModal.formData, avatar: e.target.value } })}
                        placeholder="头像URL或点击右侧选择文件"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-gray-900"
                      />
                      <label className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" /> 选择头像
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFullFieldModal({
                                  ...fullFieldModal,
                                  formData: { ...fullFieldModal.formData, avatar: reader.result as string }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setFullFieldModal(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" /> 保存全部字段
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTION TYPE CONFIG EDIT/CREATE MODAL */}
      {actionTypeModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{actionTypeModal.formData.icon || '🪴'}</span>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    {actionTypeModal.isNew ? '新增全局操作动作字段' : `修改操作动作：${actionTypeModal.formData.label}`}
                  </h3>
                  <p className="text-xs text-gray-400">设置用于应用全局的打卡动作选项</p>
                </div>
              </div>
              <button
                onClick={() => setActionTypeModal(null)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActionType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  动作名称 (Label) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={actionTypeModal.formData.label || ''}
                  onChange={(e) => setActionTypeModal({
                    ...actionTypeModal,
                    formData: { ...actionTypeModal.formData, label: e.target.value }
                  })}
                  placeholder="如：虫害防治、病害防治、补光、换盆"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    图标 Emoji / 标识
                  </label>
                  <input
                    type="text"
                    value={actionTypeModal.formData.icon || '🪴'}
                    onChange={(e) => setActionTypeModal({
                      ...actionTypeModal,
                      formData: { ...actionTypeModal.formData, icon: e.target.value }
                    })}
                    placeholder="例如：🐛, 🦠, 💡, 💦"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-bold outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    色彩风格
                  </label>
                  <select
                    value={actionTypeModal.formData.colorBg || 'bg-purple-50 hover:bg-purple-100'}
                    onChange={(e) => {
                      const bg = e.target.value;
                      let text = 'text-purple-700';
                      if (bg.includes('blue')) text = 'text-blue-700';
                      if (bg.includes('amber')) text = 'text-amber-700';
                      if (bg.includes('emerald')) text = 'text-emerald-700';
                      if (bg.includes('rose')) text = 'text-rose-700';
                      if (bg.includes('teal')) text = 'text-teal-700';
                      if (bg.includes('indigo')) text = 'text-indigo-700';
                      if (bg.includes('orange')) text = 'text-orange-700';
                      setActionTypeModal({
                        ...actionTypeModal,
                        formData: { ...actionTypeModal.formData, colorBg: bg, colorText: text }
                      });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                  >
                    <option value="bg-purple-50 hover:bg-purple-100">薰衣草紫 💜</option>
                    <option value="bg-rose-50 hover:bg-rose-100">玫瑰粉红 🌹</option>
                    <option value="bg-blue-50 hover:bg-blue-100">天空冰蓝 💧</option>
                    <option value="bg-amber-50 hover:bg-amber-100">暖黄琥珀 ✨</option>
                    <option value="bg-emerald-50 hover:bg-emerald-100">翡翠深绿 🌱</option>
                    <option value="bg-teal-50 hover:bg-teal-100">水鸭青绿 ✂️</option>
                    <option value="bg-indigo-50 hover:bg-indigo-100">靛蓝深海 📷</option>
                    <option value="bg-orange-50 hover:bg-orange-100">活力亮橙 🍊</option>
                  </select>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/80 space-y-2">
                <span className="text-xs font-extrabold text-amber-950 block">
                  选择该动作关联的特殊表单输入项：
                </span>
                
                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-900 font-medium">
                  <input
                    type="checkbox"
                    checked={!!actionTypeModal.formData.enableWaterInput}
                    onChange={(e) => setActionTypeModal({
                      ...actionTypeModal,
                      formData: { ...actionTypeModal.formData, enableWaterInput: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>💧 开启手写浇水量/浇水说明输入框</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-900 font-medium">
                  <input
                    type="checkbox"
                    checked={!!actionTypeModal.formData.enableFertilizerInput}
                    onChange={(e) => setActionTypeModal({
                      ...actionTypeModal,
                      formData: { ...actionTypeModal.formData, enableFertilizerInput: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>✨ 开启肥料名称与浓度配比输入框</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-900 font-medium">
                  <input
                    type="checkbox"
                    checked={!!actionTypeModal.formData.enableLocationInput}
                    onChange={(e) => setActionTypeModal({
                      ...actionTypeModal,
                      formData: { ...actionTypeModal.formData, enableLocationInput: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>📍 开启养护新位置变更下拉菜单</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  动作说明 (可选)
                </label>
                <input
                  type="text"
                  value={actionTypeModal.formData.description || ''}
                  onChange={(e) => setActionTypeModal({
                    ...actionTypeModal,
                    formData: { ...actionTypeModal.formData, description: e.target.value }
                  })}
                  placeholder="例如：喷洒杀虫杀菌剂、清扫叶片虫卵"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionTypeModal(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-xs transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  保存字段配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

