import { Plant, CareLog, UserProfile, StatsData, SystemConfig, SystemActionTypeConfig, PRESET_LOCATIONS, COMMON_FERTILIZERS } from '../types';

const VITE_API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

// Local storage keys
const STORAGE_KEYS = {
  PLANTS: 'pepper_plants_db_v1',
  USERS: 'pepper_users_db_v1',
  LOGS: 'pepper_logs_db_v1',
  CONFIG: 'pepper_config_db_v1',
  RECYCLE: 'pepper_recycle_db_v1'
};

// Default seed data for standalone / offline mode
const DEFAULT_PLANTS: Plant[] = [
  { id: 1, code: "辣椒 #01", name: "辣椒 #01", claimed: true, ownerName: "张伟", owners: ["张伟"], primaryDept: "技术部办公区", location: "技术部办公区", status: "生长期", health: "茁壮成长", plantedDate: "2026-08-01", avatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", careCount: 12, lastWateredAt: "2026-08-12T05:40:57.951Z", lastFertilizedAt: "2026-08-10T09:40:57.951Z", lastCareAt: "2026-08-12T05:40:57.951Z", notes: "一号朝天椒长势迅猛，顶端已经冒出第二对真叶！" },
  { id: 2, code: "辣椒 #02", name: "辣椒 #02", claimed: true, ownerName: "李娜", owners: ["李娜"], primaryDept: "财务办公区", location: "财务办公区", status: "定植期", health: "需要浇水", plantedDate: "2026-08-01", avatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", careCount: 8, lastWateredAt: "2026-08-11T03:40:57.951Z", lastFertilizedAt: "2026-08-09T09:40:57.951Z", lastCareAt: "2026-08-11T03:40:57.951Z", notes: "放在财务窗口，晒太阳充足。" },
  { id: 3, code: "辣椒 #03", name: "辣椒 #03", claimed: true, ownerName: "王强", owners: ["王强"], primaryDept: "直播间", location: "直播间", status: "生长期", health: "茁壮成长", plantedDate: "2026-08-01", avatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", careCount: 15, lastWateredAt: "2026-08-12T07:40:57.951Z", lastFertilizedAt: "2026-08-11T09:40:57.951Z", lastCareAt: "2026-08-12T07:40:57.951Z", notes: "直播间环境适宜，生长期形态端正。" },
  { id: 4, code: "辣椒 #04", name: "辣椒 #04", claimed: false, owners: [], primaryDept: "人事办公室", location: "人事办公室", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-01", avatar: "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80", careCount: 3, lastCareAt: "2026-08-12T01:40:57.951Z", notes: "人事办前台待认领。" },
  { id: 5, code: "辣椒 #05", name: "辣椒 #05", claimed: false, owners: [], primaryDept: "大厅展现区", location: "大厅展现区", status: "芽苗期", health: "需要施肥", plantedDate: "2026-08-02", avatar: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", careCount: 5, lastCareAt: "2026-08-11T21:40:57.951Z", notes: "大厅采光区待领用。" },
  { id: 6, code: "辣椒 #06", name: "辣椒 #06", claimed: false, owners: [], primaryDept: "技术部办公区", location: "技术部办公区", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-02", avatar: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80", careCount: 2 },
  { id: 7, code: "辣椒 #07", name: "辣椒 #07", claimed: false, owners: [], primaryDept: "自媒体办公区", location: "自媒体办公区", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-02", avatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", careCount: 4 },
  { id: 8, code: "辣椒 #08", name: "辣椒 #08", claimed: false, owners: [], primaryDept: "技术部办公区", location: "技术部办公区", status: "芽苗期", health: "观察中", plantedDate: "2026-08-02", avatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", careCount: 1 },
  { id: 9, code: "辣椒 #09", name: "辣椒 #09", claimed: false, owners: [], primaryDept: "财务办公区", location: "财务办公区", status: "芽苗期", health: "需要浇水", plantedDate: "2026-08-03", avatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", careCount: 1 },
  { id: 10, code: "辣椒 #10", name: "辣椒 #10", claimed: false, owners: [], primaryDept: "大厅展现区", location: "大厅展现区", status: "定植期", health: "茁壮成长", plantedDate: "2026-08-03", avatar: "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80", careCount: 3 },
  { id: 11, code: "辣椒 #11", name: "辣椒 #11", claimed: false, owners: [], primaryDept: "人事办公室", location: "人事办公室", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-03", avatar: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", careCount: 2 },
  { id: 12, code: "辣椒 #12", name: "辣椒 #12", claimed: false, owners: [], primaryDept: "自媒体办公区", location: "自媒体办公区", status: "芽苗期", health: "需要施肥", plantedDate: "2026-08-04", avatar: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80", careCount: 2 },
  { id: 13, code: "辣椒 #13", name: "辣椒 #13", claimed: false, owners: [], primaryDept: "技术部办公区", location: "技术部办公区", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-04", avatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80", careCount: 1 },
  { id: 14, code: "辣椒 #14", name: "辣椒 #14", claimed: false, owners: [], primaryDept: "财务办公区", location: "财务办公区", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-04", avatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80", careCount: 2 },
  { id: 15, code: "辣椒 #15", name: "辣椒 #15", claimed: false, owners: [], primaryDept: "大厅展现区", location: "大厅展现区", status: "芽苗期", health: "茁壮成长", plantedDate: "2026-08-05", avatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", initialAvatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", careCount: 3 }
];

const DEFAULT_USERS: UserProfile[] = [
  { id: "u-1", name: "张伟", location: "技术部办公区", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", plantIds: [1], registeredAt: "2026-08-01T08:00:00.000Z" },
  { id: "u-2", name: "李娜", location: "财务办公区", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", plantIds: [2], registeredAt: "2026-08-01T08:30:00.000Z" },
  { id: "u-3", name: "王强", location: "直播间", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150", plantIds: [3], registeredAt: "2026-08-01T09:00:00.000Z" }
];

const DEFAULT_LOGS: CareLog[] = [
  { id: "log-101", plantIds: [1], userId: "u-1", userName: "张伟", userDept: "技术部办公区", actionType: "浇水", actionIcon: "💧", waterVolume: "250ml 晾晒透水", notes: "早上巡视给1号辣苗补足了水分，土壤透气性良好。", createdAt: "2026-08-12T05:40:57.951Z", likes: [{ userName: "李娜", createdAt: "2026-08-12T09:40:57.951Z" }, { userName: "王强", createdAt: "2026-08-12T09:40:57.951Z" }], comments: [{ id: "c-1", userName: "李娜", text: "张工太勤快了！", createdAt: "2026-08-12T09:40:57.951Z" }] },
  { id: "log-102", plantIds: [3, 2], userId: "u-3", userName: "王强", userDept: "直播间", actionType: "施肥", actionIcon: "🧪", fertilizerName: "磷酸二氢钾", fertilizerConcentration: "1:1000 稀释液", helpedColleagues: ["李娜"], notes: "给自己的辣苗 #03 施了薄肥，顺便给隔壁李娜的2号辣苗也淋了一点！", createdAt: "2026-08-12T02:40:57.951Z", likes: [{ userName: "李娜", createdAt: "2026-08-12T09:40:57.951Z" }, { userName: "张伟", createdAt: "2026-08-12T09:40:57.951Z" }], comments: [{ id: "c-2", userName: "李娜", text: "谢谢强哥照顾！给你点赞👍", createdAt: "2026-08-12T09:40:57.951Z" }] }
];

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

// Helper methods for LocalStorage persistence
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

function getLocalPlants(): Plant[] { return getStored(STORAGE_KEYS.PLANTS, DEFAULT_PLANTS); }
function saveLocalPlants(plants: Plant[]) { setStored(STORAGE_KEYS.PLANTS, plants); }

function getLocalUsers(): UserProfile[] { return getStored(STORAGE_KEYS.USERS, DEFAULT_USERS); }
function saveLocalUsers(users: UserProfile[]) { setStored(STORAGE_KEYS.USERS, users); }

function getLocalLogs(): CareLog[] { return getStored(STORAGE_KEYS.LOGS, DEFAULT_LOGS); }
function saveLocalLogs(logs: CareLog[]) { setStored(STORAGE_KEYS.LOGS, logs); }

function getLocalConfig(): SystemConfig {
  const cfg = getStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  if (!cfg || !Array.isArray(cfg.actionTypes) || cfg.actionTypes.length < 14) {
    const existingLabels = new Set((cfg?.actionTypes || []).map(a => a.label || a.key));
    const missingStandard = DEFAULT_CONFIG.actionTypes.filter(def => !existingLabels.has(def.label) && !existingLabels.has(def.key));
    const updated: SystemConfig = {
      ...DEFAULT_CONFIG,
      ...cfg,
      actionTypes: [...(cfg?.actionTypes || []), ...missingStandard]
    };
    saveLocalConfig(updated);
    return updated;
  }
  return cfg;
}
function saveLocalConfig(config: SystemConfig) { setStored(STORAGE_KEYS.CONFIG, config); }

function getLocalRecycle(): Plant[] { return getStored(STORAGE_KEYS.RECYCLE, []); }
function saveLocalRecycle(plants: Plant[]) { setStored(STORAGE_KEYS.RECYCLE, plants); }

// Network fetch wrapper with fast timeout and fallback
function getUrl(url: string): string {
  if (url.startsWith('/')) {
    if (VITE_API_BASE) {
      return `${VITE_API_BASE}${url}`;
    }
    // Use relative URL (same-origin) — the Cloudflare Worker serves both
    // static assets and API routes from the same domain.
    return url;
  }
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

async function parseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `请求失败 (${res.status})`);
    } else {
      throw new Error(`服务器响应异常 (${res.status})`);
    }
  }
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`服务器返回非 JSON 数据 (${res.status}): ${text.slice(0, 80)}`);
  }
  return await res.json();
}

// System Config
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const res = await safeFetch('/api/system/config');
    const data = await parseJson(res);
    return data.config;
  } catch {
    return getLocalConfig();
  }
}

export async function updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
  try {
    const res = await safeFetch('/api/system/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.config;
  } catch {
    saveLocalConfig(config);
    return config;
  }
}

export async function addOrUpdateActionType(actionType: Partial<SystemActionTypeConfig>): Promise<SystemConfig> {
  try {
    const res = await safeFetch('/api/system/action-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionType)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.config;
  } catch {
    const cfg = getLocalConfig();
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
    saveLocalConfig(cfg);
    return cfg;
  }
}

export async function deleteActionType(id: string): Promise<SystemConfig> {
  try {
    const res = await safeFetch(`/api/system/action-types/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.config;
  } catch {
    const cfg = getLocalConfig();
    cfg.actionTypes = cfg.actionTypes.filter(a => a.id !== id);
    saveLocalConfig(cfg);
    return cfg;
  }
}

// Plants
export async function fetchPlants(): Promise<Plant[]> {
  try {
    const res = await safeFetch('/api/plants');
    const data = await parseJson(res);
    return data.plants || [];
  } catch {
    return getLocalPlants();
  }
}

export async function updatePlant(id: number, updates: Partial<Plant>): Promise<Plant> {
  try {
    const res = await safeFetch(`/api/plants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await parseJson(res);
    return data.plant;
  } catch {
    const plants = getLocalPlants();
    const idx = plants.findIndex(p => p.id === id);
    if (idx >= 0) {
      plants[idx] = { ...plants[idx], ...updates };
      saveLocalPlants(plants);
      return plants[idx];
    }
    throw new Error('未找到对应植株');
  }
}

export async function claimPlant(plantId: number, userId: string, userName: string, location?: string): Promise<Plant> {
  try {
    const res = await safeFetch(`/api/plants/${plantId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, location })
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plant;
  } catch {
    const plants = getLocalPlants();
    const plant = plants.find(p => p.id === plantId);
    if (!plant) throw new Error('未找到对应植株');
    plant.claimed = true;
    plant.ownerName = userName;
    plant.owners = [userName];
    if (location) plant.location = location;
    saveLocalPlants(plants);

    // Update user
    const users = getLocalUsers();
    const user = users.find(u => u.name === userName || u.id === userId);
    if (user) {
      if (!user.plantIds) user.plantIds = [];
      if (!user.plantIds.includes(plantId)) user.plantIds.push(plantId);
      saveLocalUsers(users);
    }
    return plant;
  }
}

export async function transferPlant(payload: { plantId: number; fromUserName: string; toUserName: string; reason?: string }): Promise<Plant> {
  try {
    const res = await safeFetch('/api/plants/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plant;
  } catch {
    const plants = getLocalPlants();
    const plant = plants.find(p => p.id === payload.plantId);
    if (!plant) throw new Error('未找到对应植株');
    plant.ownerName = payload.toUserName;
    plant.owners = [payload.toUserName];
    saveLocalPlants(plants);

    // Sync users
    const users = getLocalUsers();
    const fromUser = users.find(u => u.name === payload.fromUserName);
    if (fromUser) {
      fromUser.plantIds = (fromUser.plantIds || []).filter(id => id !== payload.plantId);
    }
    let toUser = users.find(u => u.name === payload.toUserName);
    if (toUser) {
      if (!toUser.plantIds) toUser.plantIds = [];
      if (!toUser.plantIds.includes(payload.plantId)) toUser.plantIds.push(payload.plantId);
    }
    saveLocalUsers(users);
    return plant;
  }
}

// Logs
export async function fetchLogs(params?: { plantId?: number; actionType?: string; search?: string }): Promise<CareLog[]> {
  try {
    const query = new URLSearchParams();
    if (params?.plantId) query.set('plantId', params.plantId.toString());
    if (params?.actionType) query.set('actionType', params.actionType);
    if (params?.search) query.set('search', params.search);

    const res = await safeFetch(`/api/logs?${query.toString()}`);
    const data = await parseJson(res);
    return data.logs || [];
  } catch {
    let logs = getLocalLogs();
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
    const res = await safeFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.log;
  } catch {
    const logs = getLocalLogs();
    const newLog: CareLog = {
      id: `log-${Date.now()}`,
      plantIds: logData.plantIds,
      userId: logData.userId,
      userName: logData.userName,
      userDept: logData.userDept || logData.userLocation || '技术部办公区',
      actionType: logData.actionType,
      actionIcon: logData.actionIcon || '📝',
      fertilizerName: logData.fertilizerName,
      fertilizerConcentration: logData.fertilizerConcentration,
      waterVolume: logData.waterVolume,
      notes: logData.notes,
      photo: logData.photo,
      helpedColleagues: logData.helpedColleagues,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    logs.unshift(newLog);
    saveLocalLogs(logs);

    // Update plant last care timestamp & count
    const plants = getLocalPlants();
    const nowIso = new Date().toISOString();
    logData.plantIds.forEach(pid => {
      const p = plants.find(plant => plant.id === pid);
      if (p) {
        p.careCount = (p.careCount || 0) + 1;
        p.lastCareAt = nowIso;
        if (logData.actionType === '浇水') p.lastWateredAt = nowIso;
        if (logData.actionType === '施肥') p.lastFertilizedAt = nowIso;
        if (logData.photo && logData.photo.trim() !== '') {
          p.avatar = logData.photo;
        }
      }
    });
    saveLocalPlants(plants);

    return newLog;
  }
}

export async function toggleLike(logId: string, userName: string): Promise<{ userName: string; createdAt: string }[]> {
  try {
    const res = await safeFetch(`/api/logs/${logId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName })
    });
    const data = await parseJson(res);
    return data.likes || [];
  } catch {
    const logs = getLocalLogs();
    const log = logs.find(l => l.id === logId);
    if (log) {
      if (!log.likes) log.likes = [];
      const existingIdx = log.likes.findIndex(lk => lk.userName === userName);
      if (existingIdx >= 0) {
        log.likes.splice(existingIdx, 1);
      } else {
        log.likes.push({ userName, createdAt: new Date().toISOString() });
      }
      saveLocalLogs(logs);
      return log.likes;
    }
    return [];
  }
}

export async function addComment(logId: string, userName: string, text: string) {
  try {
    const res = await safeFetch(`/api/logs/${logId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, text })
    });
    const data = await parseJson(res);
    return data.comment;
  } catch {
    const logs = getLocalLogs();
    const log = logs.find(l => l.id === logId);
    if (log) {
      if (!log.comments) log.comments = [];
      const comment = { id: `c-${Date.now()}`, userName, text, createdAt: new Date().toISOString() };
      log.comments.push(comment);
      saveLocalLogs(logs);
      return comment;
    }
    throw new Error('未找到对应日志');
  }
}

// Auth & Users
export async function authUser(payload: { name: string; password?: string; location?: string; avatar?: string }): Promise<UserProfile> {
  const cleanName = payload.name.trim();
  const isAdminAccount = cleanName.toLowerCase() === 'admin';

  try {
    const res = await safeFetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    if (data.user) {
      if (isAdminAccount) {
        data.user.isAdmin = true;
      }
      return data.user;
    }
    return data.user;
  } catch (err: any) {
    // If backend rejects credentials (e.g. password mismatch), propagate error directly!
    if (err.message && (err.message.includes('密码错误') || err.message.includes('认证失败'))) {
      throw err;
    }

    // Local Storage Fallback Mode
    const users = getLocalUsers();
    let user = users.find(u => u.name.trim().toLowerCase() === cleanName.toLowerCase());

    if (user) {
      if (user.password && payload.password && user.password !== payload.password && !isAdminAccount) {
        throw new Error('个人密码不匹配，请核对后重试');
      }
      if (payload.password && !user.password) {
        user.password = payload.password;
      }
      if (payload.location) user.location = payload.location;
      if (payload.avatar) user.avatar = payload.avatar;
      if (isAdminAccount) user.isAdmin = true;
    } else {
      // Find claimed plants for this user
      const plants = getLocalPlants();
      const claimedPlantIds = plants.filter(p => p.ownerName === cleanName || p.owners?.includes(cleanName)).map(p => p.id);

      user = {
        id: isAdminAccount ? 'admin-001' : `u-${Date.now()}`,
        name: cleanName,
        password: payload.password || '',
        location: payload.location || (isAdminAccount ? '管理员控制中心' : '技术部办公区'),
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        plantIds: claimedPlantIds,
        isAdmin: isAdminAccount,
        registeredAt: new Date().toISOString()
      };
      users.push(user);
    }
    saveLocalUsers(users);
    return user;
  }
}

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const res = await safeFetch('/api/users');
    const data = await parseJson(res);
    return data.users || [];
  } catch {
    return getLocalUsers();
  }
}

export async function adminLogin(password: string) {
  try {
    const res = await safeFetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return await parseJson(res);
  } catch {
    if (password === 'admin123' || password === 'admin') {
      return { success: true, token: 'local-admin-token' };
    }
    return { success: false, message: '管理员密码错误（默认: admin123）' };
  }
}

export async function adminDeleteUser(userId: string, adminPassword?: string) {
  try {
    const res = await safeFetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword })
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const users = getLocalUsers().filter(u => u.id !== userId);
    saveLocalUsers(users);
    return { success: true, message: '用户已删除' };
  }
}

export async function adminBanUser(userId: string, isBanned: boolean) {
  try {
    const res = await safeFetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBanned })
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const users = getLocalUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.isBanned = isBanned;
      saveLocalUsers(users);
    }
    return { success: true };
  }
}

export async function adminResetUserPassword(userId: string, newPassword?: string) {
  try {
    const res = await safeFetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const users = getLocalUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.password = newPassword || '';
      saveLocalUsers(users);
    }
    return { success: true };
  }
}

export async function adminBatchCreatePlants(payload: { count: number; prefix?: string; location?: string; status?: string; health?: string }): Promise<Plant[]> {
  try {
    const res = await safeFetch('/api/admin/plants/batch-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plants;
  } catch {
    const plants = getLocalPlants();
    const created: Plant[] = [];
    const maxId = plants.reduce((max, p) => Math.max(max, p.id), 0);

    for (let i = 1; i <= payload.count; i++) {
      const nextId = maxId + i;
      const code = `${payload.prefix || '辣椒'} #${nextId < 10 ? '0' + nextId : nextId}`;
      const newP: Plant = {
        id: nextId,
        code,
        name: code,
        claimed: false,
        owners: [],
        primaryDept: payload.location || '技术部办公区',
        location: payload.location || '技术部办公区',
        status: payload.status || '芽苗期',
        health: payload.health || '茁壮成长',
        plantedDate: new Date().toISOString().split('T')[0],
        avatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80",
        initialAvatar: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80",
        careCount: 0
      };
      plants.push(newP);
      created.push(newP);
    }
    saveLocalPlants(plants);
    return created;
  }
}

export async function adminDeletePlant(plantId: number) {
  try {
    const res = await safeFetch(`/api/admin/plants/${plantId}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const plants = getLocalPlants().filter(p => p.id !== plantId);
    saveLocalPlants(plants);
    return { success: true };
  }
}

export async function adminRecyclePlant(plantId: number) {
  try {
    const res = await safeFetch(`/api/admin/plants/${plantId}/recycle`, { method: 'POST' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const plants = getLocalPlants();
    const idx = plants.findIndex(p => p.id === plantId);
    if (idx >= 0) {
      const [removed] = plants.splice(idx, 1);
      saveLocalPlants(plants);
      const recycle = getLocalRecycle();
      recycle.push(removed);
      saveLocalRecycle(recycle);
    }
    return { success: true };
  }
}

export async function adminRestorePlant(plantId: number) {
  try {
    const res = await safeFetch(`/api/admin/plants/${plantId}/restore`, { method: 'POST' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data;
  } catch {
    const recycle = getLocalRecycle();
    const idx = recycle.findIndex(p => p.id === plantId);
    if (idx >= 0) {
      const [restored] = recycle.splice(idx, 1);
      saveLocalRecycle(recycle);
      const plants = getLocalPlants();
      plants.push(restored);
      saveLocalPlants(plants);
    }
    return { success: true };
  }
}

export async function adminResetPlant(plantId: number): Promise<Plant> {
  try {
    const res = await safeFetch(`/api/admin/plants/${plantId}/reset`, { method: 'POST' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plant;
  } catch {
    const plants = getLocalPlants();
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      plant.claimed = false;
      plant.ownerName = undefined;
      plant.owners = [];
      plant.status = '芽苗期';
      plant.health = '茁壮成长';
      plant.careCount = 0;
      saveLocalPlants(plants);
      return plant;
    }
    throw new Error('未找到对应植株');
  }
}

export async function fetchRecycleBinPlants(): Promise<Plant[]> {
  try {
    const res = await safeFetch('/api/admin/recycle-bin');
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plants;
  } catch {
    return getLocalRecycle();
  }
}

export async function adminUnclaimPlant(plantId: number): Promise<Plant> {
  try {
    const res = await safeFetch(`/api/admin/plants/${plantId}/unclaim`, { method: 'POST' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plant;
  } catch {
    return adminResetPlant(plantId);
  }
}

export async function fetchStats(): Promise<StatsData> {
  try {
    const res = await safeFetch('/api/stats');
    const data = await parseJson(res);
    return data;
  } catch {
    const plants = getLocalPlants();
    const logs = getLocalLogs();
    const totalPlants = plants.length;
    const claimedCount = plants.filter(p => p.claimed).length;
    const totalLogs = logs.length;
    const wateringCount = logs.filter(l => l.actionType === '浇水').length;
    const fertilizingCount = logs.filter(l => l.actionType === '施肥').length;

    return {
      totalCareLogs: totalLogs,
      totalLogs,
      thrivingPlants: plants.filter(p => p.health === '茁壮成长').length,
      thirstyPlants: plants.filter(p => p.health === '需要浇水').length,
      topGardeners: [],
      topHelpers: [],
      topPhotographers: []
    };
  }
}

export async function adminCreateSinglePlant(plantData: Partial<Plant>): Promise<Plant> {
  try {
    const res = await safeFetch('/api/admin/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plantData)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.plant;
  } catch {
    const plants = getLocalPlants();
    const maxId = plants.reduce((m, p) => Math.max(m, p.id), 0);
    const newId = maxId + 1;
    const code = plantData.code || `辣椒 #${newId < 10 ? '0' + newId : newId}`;
    const newPlant: Plant = {
      id: newId,
      code,
      name: plantData.name || code,
      claimed: !!plantData.claimed,
      ownerName: plantData.ownerName,
      owners: plantData.owners || (plantData.ownerName ? [plantData.ownerName] : []),
      primaryDept: plantData.primaryDept || '技术部办公区',
      location: plantData.location || '技术部办公区',
      status: plantData.status || '芽苗期',
      health: plantData.health || '茁壮成长',
      plantedDate: plantData.plantedDate || new Date().toISOString().split('T')[0],
      avatar: plantData.avatar || "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80",
      initialAvatar: plantData.initialAvatar || plantData.avatar || "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80",
      careCount: 0
    };
    plants.push(newPlant);
    saveLocalPlants(plants);
    return newPlant;
  }
}

export async function adminCreateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const res = await safeFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.user;
  } catch {
    const users = getLocalUsers();
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: userData.name || '新成员',
      password: userData.password || '',
      location: userData.location || '技术部办公区',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      plantIds: userData.plantIds || [],
      registeredAt: new Date().toISOString()
    };
    users.push(newUser);
    saveLocalUsers(users);
    return newUser;
  }
}

export async function adminUpdateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const res = await safeFetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.user;
  } catch {
    const users = getLocalUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      saveLocalUsers(users);
      return user;
    }
    throw new Error('未找到对应用户');
  }
}

export async function adminCreateCareLog(logData: Partial<CareLog>): Promise<CareLog> {
  try {
    const res = await safeFetch('/api/admin/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.log;
  } catch {
    return createLog({
      plantIds: logData.plantIds || [1],
      userId: logData.userId || 'u-admin',
      userName: logData.userName || '管理员',
      userDept: logData.userDept || '管理区',
      actionType: logData.actionType || '浇水',
      notes: logData.notes
    });
  }
}

export async function adminUpdateCareLog(id: string, updates: Partial<CareLog>): Promise<CareLog> {
  try {
    const res = await safeFetch(`/api/admin/logs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
    return data.log;
  } catch {
    const logs = getLocalLogs();
    const log = logs.find(l => l.id === id);
    if (log) {
      Object.assign(log, updates);
      saveLocalLogs(logs);
      return log;
    }
    throw new Error('未找到对应日志');
  }
}

export async function adminDeleteCareLog(id: string): Promise<void> {
  try {
    const res = await safeFetch(`/api/admin/logs/${id}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!data.success) throw new Error(data.message);
  } catch {
    const logs = getLocalLogs().filter(l => l.id !== id);
    saveLocalLogs(logs);
  }
}

export async function askAiExpert(question: string, plantName?: string, healthStatus?: string, imageBase64?: string): Promise<string> {
  try {
    const res = await safeFetch('/api/ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, plantName, healthStatus, imageBase64 })
    });
    const data = await parseJson(res);
    return data.answer || '暂无回复';
  } catch {
    return `【农小蛙植物AI助手智能提示】: 收到关于《${plantName || '辣椒苗'}》（状态：${healthStatus || '正常'}）的询问：“${question}”。建议保持每日适度散光照射，避免积水，保持通风良好；如遇虫害可适当擦拭或使用无毒有机除虫液。`;
  }
}
