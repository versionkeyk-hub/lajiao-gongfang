import { Plant, CareLog, UserProfile, StatsData, SystemConfig, SystemActionTypeConfig, PRESET_LOCATIONS, COMMON_FERTILIZERS } from '../types';

// ─── Network helpers (same-domain relative path on Cloudflare Pages) ───
function getUrl(url: string): string {
  if (url.startsWith('/')) return url;
  return url;
}

async function safeFetch(url: string, options?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const targetUrl = getUrl(url);
  const res = await fetch(targetUrl, { ...options, signal: controller.signal });
  clearTimeout(timer);
  return res;
}

async function apiGet<T = any>(url: string): Promise<T> {
  const res = await safeFetch(url);
  return res.json();
}

async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const res = await safeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  const res = await safeFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await safeFetch(url, { method: 'DELETE' });
  return res.json();
}

// ─── Default config fallback ───
const DEFAULT_CONFIG: SystemConfig = {
  actionTypes: [
    { id: 'act-1', key: '浇水', label: '浇水', icon: '💧', colorBg: 'bg-blue-100', colorText: 'text-blue-800', enableWaterInput: true },
    { id: 'act-2', key: '施肥', label: '施肥', icon: '🧪', colorBg: 'bg-amber-100', colorText: 'text-amber-800', enableFertilizerInput: true },
    { id: 'act-3', key: '叶面肥', label: '叶面肥', icon: '🌱', colorBg: 'bg-emerald-100', colorText: 'text-emerald-800', enableFertilizerInput: true },
    { id: 'act-4', key: '松土培土', label: '松土培土', icon: '🌾', colorBg: 'bg-orange-100', colorText: 'text-orange-800' },
    { id: 'act-5', key: '打药防虫', label: '打药防虫', icon: '🐛', colorBg: 'bg-purple-100', colorText: 'text-purple-800' },
    { id: 'act-6', key: '打顶剪枝', label: '打顶剪枝', icon: '✂️', colorBg: 'bg-teal-100', colorText: 'text-teal-800' },
    { id: 'act-7', key: '位置变更', label: '位置变更', icon: '📍', colorBg: 'bg-rose-100', colorText: 'text-rose-800', enableLocationInput: true },
    { id: 'act-8', key: '成长拍照', label: '成长拍照', icon: '📷', colorBg: 'bg-indigo-100', colorText: 'text-indigo-800' },
    { id: 'act-9', key: '日光照射', label: '日光照射', icon: '☀️', colorBg: 'bg-yellow-100', colorText: 'text-yellow-800' },
    { id: 'act-10', key: '除草清理', label: '除草清理', icon: '🌿', colorBg: 'bg-lime-100', colorText: 'text-lime-800' },
    { id: 'act-11', key: '换盆翻土', label: '换盆翻土', icon: '🪴', colorBg: 'bg-stone-100', colorText: 'text-stone-800' },
    { id: 'act-12', key: '采摘收获', label: '采摘收获', icon: '🌶️', colorBg: 'bg-red-100', colorText: 'text-red-800' },
    { id: 'act-13', key: '人工授粉', label: '人工授粉', icon: '🌸', colorBg: 'bg-fuchsia-100', colorText: 'text-fuchsia-800' },
    { id: 'act-14', key: '互助照顾', label: '互助照顾', icon: '🤝', colorBg: 'bg-cyan-100', colorText: 'text-cyan-800' }
  ],
  growthStages: ['芽苗期', '定植期', '生长期', '开花期', '挂果期', '成熟收获期'],
  healthStatuses: ['茁壮成长', '需要浇水', '需要施肥', '观察中', '需要修剪'],
  locations: PRESET_LOCATIONS,
  fertilizers: COMMON_FERTILIZERS
};

// ─── System Config ───
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const data = await apiGet<{ success: boolean; config: SystemConfig }>('/api/config');
    return data.config || DEFAULT_CONFIG;
  } catch (err) {
    console.error('Fetch config error:', err);
    return DEFAULT_CONFIG;
  }
}

export async function updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
  try {
    await apiPut('/api/config', config);
  } catch (err) {
    console.error('Update config error:', err);
  }
  return config;
}

export async function addOrUpdateActionType(actionType: Partial<SystemActionTypeConfig>): Promise<SystemConfig> {
  const cfg = await fetchSystemConfig();
  const existingIdx = cfg.actionTypes.findIndex(a => a.id === actionType.id || a.key === actionType.key || a.label === actionType.label);
  if (existingIdx >= 0) {
    cfg.actionTypes[existingIdx] = { ...cfg.actionTypes[existingIdx], ...actionType };
  } else {
    cfg.actionTypes.push({
      id: `act-${Date.now()}`,
      key: actionType.key || actionType.label || '打卡',
      label: actionType.label || actionType.key || '打卡',
      icon: actionType.icon || '🌱',
      colorBg: actionType.colorBg || 'bg-emerald-100',
      colorText: actionType.colorText || 'text-emerald-800',
      ...actionType
    });
  }
  return await updateSystemConfig(cfg);
}

export async function deleteActionType(id: string): Promise<SystemConfig> {
  const cfg = await fetchSystemConfig();
  cfg.actionTypes = cfg.actionTypes.filter(a => a.id !== id);
  return await updateSystemConfig(cfg);
}

// ─── Plants Management ───
export async function fetchPlants(): Promise<Plant[]> {
  try {
    const data = await apiGet<{ success: boolean; plants: Plant[] }>('/api/plants');
    return data.plants || [];
  } catch (err) {
    console.error('Fetch plants error:', err);
    return [];
  }
}

export async function updatePlant(id: number, updates: Partial<Plant>): Promise<Plant> {
  try {
    const data = await apiPut<{ success: boolean; plant: Plant }>(`/api/plants/${id}`, updates);
    if (!data.success) throw new Error(data.message || '更新失败');
    return data.plant;
  } catch (err) {
    console.error('Update plant error:', err);
    throw new Error('更新植株信息失败');
  }
}

export async function claimPlant(plantId: number, userId: string, userName: string, location?: string): Promise<Plant> {
  try {
    const data = await apiPost<{ success: boolean; plant: Plant; message?: string }>(`/api/plants/${plantId}/claim`, { userId, userName, location });
    if (!data.success) throw new Error(data.message || '认领失败');
    return data.plant;
  } catch (err: any) {
    console.error('Claim plant error:', err);
    throw new Error(err.message || '认领植株失败');
  }
}

export async function transferPlant(payload: { plantId: number; fromUserName: string; toUserName: string; reason?: string }): Promise<Plant> {
  try {
    const data = await apiPost<{ success: boolean; plant: Plant; message?: string }>('/api/plants/transfer', payload);
    if (!data.success) throw new Error(data.message || '交接失败');
    return data.plant;
  } catch (err: any) {
    console.error('Transfer plant error:', err);
    throw new Error(err.message || '交接植株失败');
  }
}

// ─── Care Logs Management ───
export async function fetchLogs(params?: { plantId?: number; actionType?: string; search?: string }): Promise<CareLog[]> {
  try {
    const data = await apiGet<{ success: boolean; logs: CareLog[] }>('/api/logs');
    let logs = data.logs || [];

    if (params?.plantId) {
      logs = logs.filter(l => l.plantIds && l.plantIds.includes(params.plantId!));
    }
    if (params?.actionType && params.actionType !== '全部') {
      logs = logs.filter(l => l.actionType === params.actionType);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      logs = logs.filter(l => l.userName.toLowerCase().includes(q) || (l.notes && l.notes.toLowerCase().includes(q)));
    }

    return logs;
  } catch (err) {
    console.error('Fetch logs error:', err);
    return [];
  }
}

export async function createLog(logData: {
  plantIds: number[];
  userId: string;
  userName: string;
  userDept?: string;
  userLocation?: string;
  userAvatar?: string;
  actionType: string;
  actionIcon?: string;
  fertilizerName?: string;
  fertilizerConcentration?: string;
  locationNew?: string;
  waterVolume?: string;
  photo?: string;
  notes?: string;
  helpedColleagues?: string[];
}): Promise<CareLog> {
  try {
    const data = await apiPost<{ success: boolean; log: CareLog; message?: string }>('/api/logs', logData);
    if (!data.success) throw new Error(data.message || '提交失败');
    return data.log;
  } catch (err: any) {
    console.error('Create log error:', err);
    throw new Error(err.message || '提交打卡日志失败');
  }
}

export async function toggleLike(logId: string, userName: string): Promise<{ userName: string; createdAt: string }[]> {
  try {
    const data = await apiPost<{ success: boolean; likes: any[] }>(`/api/logs/${logId}/like`, { userName });
    return data.likes || [];
  } catch (err) {
    console.error('Toggle like error:', err);
    return [];
  }
}

export async function addComment(logId: string, userName: string, text: string) {
  try {
    const data = await apiPost<{ success: boolean; comment: any }>(`/api/logs/${logId}/comments`, { userName, text });
    if (!data.success) throw new Error('评论失败');
    return data.comment;
  } catch (err) {
    console.error('Add comment error:', err);
    throw new Error('评论提交失败');
  }
}

export async function deleteComment(logId: string, commentId: string): Promise<CareLog['comments']> {
  try {
    const data = await apiDelete<{ success: boolean; comments: any[] }>(`/api/logs/${logId}/comments/${commentId}`);
    return data.comments || [];
  } catch (err) {
    console.error('Delete comment error:', err);
    throw new Error('删除评论失败');
  }
}

export async function softDeleteCareLog(logId: string, isDeleted = true): Promise<void> {
  try {
    await apiPut(`/api/logs/${logId}/status`, { isDeleted });
  } catch (err) {
    console.error('Soft delete log error:', err);
    throw new Error('动态删除/恢复操作失败');
  }
}

// ─── User & Auth Management ───
export async function authUser(payload: { name: string; password?: string; location?: string; avatar?: string }): Promise<UserProfile> {
  const cleanName = payload.name.trim();
  try {
    const data = await apiPost<{ success: boolean; user: UserProfile; message?: string }>('/api/login', {
      name: cleanName,
      password: payload.password || '123',
      location: payload.location,
      avatar: payload.avatar
    });
    if (!data.success) throw new Error(data.message || '认证失败');
    return data.user;
  } catch (err: any) {
    if (err.message && (err.message.includes('密码') || err.message.includes('封禁'))) {
      throw err;
    }
    console.error('Auth user error:', err);
    throw err;
  }
}

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const data = await apiGet<{ success: boolean; users: UserProfile[] }>('/api/users');
    return data.users || [];
  } catch (err) {
    console.error('Fetch users error:', err);
    return [];
  }
}

export async function adminLogin(password: string) {
  try {
    const data = await apiPost<{ success: boolean; message?: string }>('/api/admin/login', { password });
    return data;
  } catch {
    return { success: false, message: '管理员登录失败' };
  }
}

export async function adminDeleteUser(userId: string, adminPassword?: string) {
  try {
    const data = await apiDelete<{ success: boolean; message?: string }>(`/api/admin/users/${userId}`);
    if (!data.success) throw new Error(data.message || '删除失败');
    return { success: true, message: '用户已删除' };
  } catch (err) {
    console.error('Delete user error:', err);
    throw new Error('删除用户失败');
  }
}

export async function adminBanUser(userId: string, isBanned: boolean) {
  try {
    const data = await apiPost<{ success: boolean; message?: string }>(`/api/admin/users/${userId}/ban`, { isBanned });
    if (!data.success) throw new Error(data.message || '操作失败');
    return { success: true };
  } catch (err) {
    console.error('Ban user error:', err);
    throw new Error('状态修改失败');
  }
}

export async function adminResetUserPassword(userId: string, newPassword?: string) {
  try {
    const data = await apiPost<{ success: boolean; message?: string }>(`/api/admin/users/${userId}/reset-password`, { newPassword });
    if (!data.success) throw new Error(data.message || '重置失败');
    return { success: true };
  } catch (err) {
    console.error('Reset password error:', err);
    throw new Error('密码重置失败');
  }
}

// ─── Admin Plant Management ───
export async function adminBatchCreatePlants(payload: { count: number; prefix?: string; location?: string; status?: string; health?: string }): Promise<Plant[]> {
  try {
    const data = await apiPost<{ success: boolean; plants: Plant[]; message?: string }>('/api/admin/plants/batch-create', payload);
    if (!data.success) throw new Error(data.message || '创建失败');
    return data.plants || [];
  } catch (err) {
    console.error('Batch create plants error:', err);
    throw new Error('批量创建植株失败');
  }
}

export async function adminDeletePlant(plantId: number) {
  try {
    const data = await apiDelete<{ success: boolean; message?: string }>(`/api/admin/plants/${plantId}`);
    if (!data.success) throw new Error(data.message || '删除失败');
    return { success: true };
  } catch (err) {
    console.error('Delete plant error:', err);
    throw new Error('删除植物失败');
  }
}

export async function adminRecyclePlant(plantId: number) {
  try {
    const data = await apiPost<{ success: boolean; message?: string }>(`/api/admin/plants/${plantId}/recycle`);
    if (!data.success) throw new Error(data.message || '操作失败');
    return { success: true };
  } catch (err) {
    console.error('Recycle plant error:', err);
    throw new Error('放入回收站失败');
  }
}

export async function adminRestorePlant(plantId: number) {
  try {
    const data = await apiPost<{ success: boolean; message?: string }>(`/api/admin/plants/${plantId}/restore`);
    if (!data.success) throw new Error(data.message || '操作失败');
    return { success: true };
  } catch (err) {
    console.error('Restore plant error:', err);
    throw new Error('还原植物失败');
  }
}

export async function adminResetPlant(plantId: number): Promise<Plant> {
  try {
    const data = await apiPost<{ success: boolean; plant: Plant; message?: string }>(`/api/admin/plants/${plantId}/reset`);
    if (!data.success) throw new Error(data.message || '重置失败');
    return data.plant;
  } catch (err) {
    console.error('Reset plant error:', err);
    throw new Error('重置植株失败');
  }
}

export async function fetchRecycleBinPlants(): Promise<Plant[]> {
  try {
    const data = await apiGet<{ success: boolean; plants: Plant[] }>('/api/admin/recycle-bin');
    return data.plants || [];
  } catch (err) {
    console.error('Fetch recycle bin error:', err);
    return [];
  }
}

export async function adminUnclaimPlant(plantId: number): Promise<Plant> {
  try {
    const data = await apiPost<{ success: boolean; plant: Plant; message?: string }>(`/api/admin/plants/${plantId}/unclaim`);
    if (!data.success) throw new Error(data.message || '操作失败');
    return data.plant;
  } catch (err) {
    console.error('Unclaim plant error:', err);
    throw new Error('取消认领失败');
  }
}

// ─── Stats ───
export async function fetchStats(): Promise<StatsData> {
  try {
    const data = await apiGet<{ success: boolean; totalLogs: number; totalCareLogs: number; totalUsers: number; thrivingPlants: number; thirstyPlants: number; topGardeners: any[]; topHelpers: any[]; topPhotographers: any[]; users?: any[] }>('/api/stats');
    return {
      totalCareLogs: data.totalCareLogs || 0,
      totalLogs: data.totalLogs || 0,
      totalUsers: data.totalUsers || 0,
      thrivingPlants: data.thrivingPlants || 0,
      thirstyPlants: data.thirstyPlants || 0,
      topGardeners: data.topGardeners || [],
      topHelpers: data.topHelpers || [],
      topPhotographers: data.topPhotographers || [],
      users: data.users || []
    };
  } catch (err) {
    console.error('Fetch stats error:', err);
    return {
      totalCareLogs: 0,
      totalLogs: 0,
      thrivingPlants: 0,
      thirstyPlants: 0,
      topGardeners: [],
      topHelpers: [],
      topPhotographers: []
    };
  }
}

// ─── Admin: Create Single Plant ───
export async function adminCreateSinglePlant(plantData: Partial<Plant>): Promise<Plant> {
  try {
    const data = await apiPost<{ success: boolean; plant: Plant; message?: string }>('/api/admin/plants', plantData);
    if (!data.success) throw new Error(data.message || '创建失败');
    return data.plant;
  } catch (err) {
    console.error('Create plant error:', err);
    throw new Error('创建植株失败');
  }
}

// ─── Admin: User Management ───
export async function adminCreateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const data = await apiPost<{ success: boolean; user: UserProfile; message?: string }>('/api/admin/users', userData);
    if (!data.success) throw new Error(data.message || '创建失败');
    return data.user;
  } catch (err) {
    console.error('Create user error:', err);
    throw new Error('创建用户失败');
  }
}

export async function adminUpdateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const data = await apiPut<{ success: boolean; user: UserProfile; message?: string }>(`/api/admin/users/${userId}`, updates);
    if (!data.success) throw new Error(data.message || '更新失败');
    return data.user;
  } catch (err) {
    console.error('Update user error:', err);
    throw new Error('更新用户失败');
  }
}

// ─── Admin: Care Log Management ───
export async function adminCreateCareLog(logData: Partial<CareLog>): Promise<CareLog> {
  try {
    const data = await apiPost<{ success: boolean; log: CareLog; message?: string }>('/api/admin/logs', logData);
    if (!data.success) throw new Error(data.message || '创建失败');
    return data.log;
  } catch (err) {
    console.error('Admin create log error:', err);
    throw new Error('创建日志失败');
  }
}

export async function adminUpdateCareLog(id: string, updates: Partial<CareLog>): Promise<CareLog> {
  try {
    const data = await apiPut<{ success: boolean; log: CareLog; message?: string }>(`/api/admin/logs/${id}`, updates);
    if (!data.success) throw new Error(data.message || '更新失败');
    return data.log;
  } catch (err) {
    console.error('Admin update log error:', err);
    throw new Error('更新日志失败');
  }
}

export async function adminDeleteCareLog(id: string): Promise<void> {
  await softDeleteCareLog(id, true);
}

export async function adminRestoreCareLog(id: string): Promise<void> {
  await softDeleteCareLog(id, false);
}

export async function adminDeleteCareLogPermanently(id: string): Promise<void> {
  try {
    await apiDelete(`/api/admin/logs/${id}`);
  } catch (err) {
    console.error('Permanent delete log error:', err);
    throw new Error('永久删除失败');
  }
}

// ─── AI Expert ───
export async function askAiExpert(question: string, plantName?: string, healthStatus?: string, imageBase64?: string): Promise<string> {
  try {
    const data = await apiPost<{ answer: string }>('/api/ai/diagnose', { question, plantName, healthStatus, imageBase64 });
    return data.answer || '暂无回复';
  } catch {
    return `【农小蛙植物AI助手智能提示】: 收到关于《${plantName || '辣椒苗'}》（状态：${healthStatus || '正常'}）的询问："${question}"。建议保持每日适度散光照射，避免积水，保持通风良好；如遇虫害可适当擦拭或使用无毒有机除虫液。`;
  }
}

// ─── Polling subscriptions (replace Firestore onSnapshot) ───
export function subscribePlants(onChange: (plants: Plant[]) => void) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const data = await apiGet<{ success: boolean; plants: Plant[] }>('/api/plants');
      if (active && data.plants) onChange(data.plants);
    } catch { /* ignore */ }
  };
  poll();
  const interval = setInterval(poll, 15000);
  return () => { active = false; clearInterval(interval); };
}

export function subscribeLogs(onChange: (logs: CareLog[]) => void) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const data = await apiGet<{ success: boolean; logs: CareLog[] }>('/api/logs');
      if (active && data.logs) onChange(data.logs);
    } catch { /* ignore */ }
  };
  poll();
  const interval = setInterval(poll, 15000);
  return () => { active = false; clearInterval(interval); };
}

export function subscribeConfig(onChange: (config: SystemConfig) => void) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const data = await apiGet<{ success: boolean; config: SystemConfig }>('/api/config');
      if (active && data.config) onChange(data.config);
    } catch { /* ignore */ }
  };
  poll();
  const interval = setInterval(poll, 30000);
  return () => { active = false; clearInterval(interval); };
}
