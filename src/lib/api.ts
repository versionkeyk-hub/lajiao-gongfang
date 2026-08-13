import { Plant, CareLog, UserProfile, StatsData, SystemConfig, SystemActionTypeConfig, PRESET_LOCATIONS, COMMON_FERTILIZERS } from '../types';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';

const VITE_API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
// Default seed data for Firestore initial seeding
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

// Network URL helper for background Express calls if needed
function getUrl(url: string): string {
  if (url.startsWith('/')) {
    if (VITE_API_BASE) {
      return `${VITE_API_BASE}${url}`;
    }
    return url;
  }
  return url;
}${url}`;
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('pages.dev') || host.includes('cloudflare') || (!host.includes('localhost') && !host.includes('run.app') && !host.includes('127.0.0.1'))) {
        return `${CLOUD_RUN_BACKEND}${url}`;
      }
    }
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

// -------------------------------------------------------------
// FIRESTORE SEEDING & FETCH HELPERS
// -------------------------------------------------------------

export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const cfgRef = doc(db, 'config', 'systemConfig');
    const snap = await getDoc(cfgRef);
    if (!snap.exists()) {
      await setDoc(cfgRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const data = snap.data() as SystemConfig;
    if (!data.actionTypes || data.actionTypes.length < 14) {
      const existingLabels = new Set((data.actionTypes || []).map(a => a.label || a.key));
      const missingStandard = DEFAULT_CONFIG.actionTypes.filter(def => !existingLabels.has(def.label) && !existingLabels.has(def.key));
      const updated: SystemConfig = {
        ...DEFAULT_CONFIG,
        ...data,
        actionTypes: [...(data.actionTypes || []), ...missingStandard]
      };
      await setDoc(cfgRef, updated);
      return updated;
    }
    return data;
  } catch (err) {
    console.error('Firestore fetch config error:', err);
    return DEFAULT_CONFIG;
  }
}

export async function updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
  try {
    const cfgRef = doc(db, 'config', 'systemConfig');
    await setDoc(cfgRef, config);
    // Background sync to backend
    safeFetch('/api/system/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }).catch(() => null);
    return config;
  } catch (err) {
    console.error('Firestore update config error:', err);
    return config;
  }
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

// -------------------------------------------------------------
// PLANTS MANAGEMENT
// -------------------------------------------------------------

export async function fetchPlants(): Promise<Plant[]> {
  try {
    const colRef = collection(db, 'plants');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed default plants
      for (const p of DEFAULT_PLANTS) {
        await setDoc(doc(db, 'plants', p.id.toString()), p);
      }
      return DEFAULT_PLANTS;
    }
    const plants: Plant[] = [];
    snapshot.forEach(docSnap => {
      plants.push(docSnap.data() as Plant);
    });
    plants.sort((a, b) => a.id - b.id);
    return plants;
  } catch (err) {
    console.error('Firestore fetch plants error:', err);
    return DEFAULT_PLANTS;
  }
}

export async function updatePlant(id: number, updates: Partial<Plant>): Promise<Plant> {
  try {
    const pRef = doc(db, 'plants', id.toString());
    const snap = await getDoc(pRef);
    let updatedPlant: Plant;
    if (snap.exists()) {
      updatedPlant = { ...(snap.data() as Plant), ...updates };
    } else {
      updatedPlant = { id, code: `辣椒 #${id < 10 ? '0' + id : id}`, name: `辣椒 #${id < 10 ? '0' + id : id}`, claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区', status: '芽苗期', health: '茁壮成长', plantedDate: new Date().toISOString().split('T')[0], avatar: '', initialAvatar: '', careCount: 0, ...updates };
    }
    await setDoc(pRef, updatedPlant, { merge: true });
    safeFetch(`/api/plants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }).catch(() => null);
    return updatedPlant;
  } catch (err) {
    console.error('Firestore update plant error:', err);
    throw new Error('更新植株信息失败');
  }
}

export async function claimPlant(plantId: number, userId: string, userName: string, location?: string): Promise<Plant> {
  try {
    const pRef = doc(db, 'plants', plantId.toString());
    const snap = await getDoc(pRef);
    let plant: Plant = snap.exists() 
      ? (snap.data() as Plant)
      : { id: plantId, code: `辣椒 #${plantId}`, name: `辣椒 #${plantId}`, claimed: false, owners: [], primaryDept: location || '技术部办公区', location: location || '技术部办公区', status: '芽苗期', health: '茁壮成长', plantedDate: new Date().toISOString().split('T')[0], avatar: '', initialAvatar: '', careCount: 0 };

    plant.claimed = true;
    plant.ownerName = userName;
    plant.owners = [userName];
    if (location) plant.location = location;

    await setDoc(pRef, plant, { merge: true });

    // Update user plantIds in Firestore
    const uRef = doc(db, 'users', userId || userName);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const uData = uSnap.data() as UserProfile;
      const plantIds = Array.isArray(uData.plantIds) ? uData.plantIds : [];
      if (!plantIds.includes(plantId)) plantIds.push(plantId);
      await updateDoc(uRef, { plantIds });
    }

    safeFetch(`/api/plants/${plantId}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, userName, location }) }).catch(() => null);
    return plant;
  } catch (err) {
    console.error('Firestore claim plant error:', err);
    throw new Error('认领植株失败');
  }
}

export async function transferPlant(payload: { plantId: number; fromUserName: string; toUserName: string; reason?: string }): Promise<Plant> {
  try {
    const pRef = doc(db, 'plants', payload.plantId.toString());
    const snap = await getDoc(pRef);
    if (!snap.exists()) throw new Error('未找到对应植株');
    const plant = snap.data() as Plant;
    plant.ownerName = payload.toUserName;
    plant.owners = [payload.toUserName];

    await setDoc(pRef, plant, { merge: true });

    // Sync users in Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(async uSnap => {
      const user = uSnap.data() as UserProfile;
      if (user.name === payload.fromUserName && user.plantIds) {
        const updated = user.plantIds.filter(id => id !== payload.plantId);
        await updateDoc(doc(db, 'users', uSnap.id), { plantIds: updated });
      }
      if (user.name === payload.toUserName) {
        const plantIds = Array.isArray(user.plantIds) ? user.plantIds : [];
        if (!plantIds.includes(payload.plantId)) plantIds.push(payload.plantId);
        await updateDoc(doc(db, 'users', uSnap.id), { plantIds });
      }
    });

    safeFetch('/api/plants/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => null);
    return plant;
  } catch (err) {
    console.error('Firestore transfer plant error:', err);
    throw new Error('交接植株失败');
  }
}

// -------------------------------------------------------------
// CARE LOGS MANAGEMENT
// -------------------------------------------------------------

export async function fetchLogs(params?: { plantId?: number; actionType?: string; search?: string }): Promise<CareLog[]> {
  try {
    const colRef = collection(db, 'logs');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      for (const l of DEFAULT_LOGS) {
        await setDoc(doc(db, 'logs', l.id), l);
      }
      return DEFAULT_LOGS;
    }
    let logs: CareLog[] = [];
    snapshot.forEach(docSnap => {
      logs.push(docSnap.data() as CareLog);
    });

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

    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs;
  } catch (err) {
    console.error('Firestore fetch logs error:', err);
    return DEFAULT_LOGS;
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
    const logId = `log-${Date.now()}`;
    const newLog: CareLog = {
      id: logId,
      plantIds: logData.plantIds,
      userId: logData.userId,
      userName: logData.userName,
      userDept: logData.userDept || logData.userLocation || '技术部办公区',
      actionType: logData.actionType,
      actionIcon: logData.actionIcon || '📝',
      fertilizerName: logData.fertilizerName,
      fertilizerConcentration: logData.fertilizerConcentration,
      locationNew: logData.locationNew,
      waterVolume: logData.waterVolume,
      notes: logData.notes,
      photo: logData.photo,
      helpedColleagues: logData.helpedColleagues,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };

    await setDoc(doc(db, 'logs', logId), newLog);

    // Update affected plant documents in Firestore
    const nowIso = new Date().toISOString();
    for (const pid of logData.plantIds) {
      const pRef = doc(db, 'plants', pid.toString());
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        const pData = pSnap.data() as Plant;
        const updates: Partial<Plant> = {
          careCount: (pData.careCount || 0) + 1,
          lastCareAt: nowIso
        };
        if (logData.actionType === '浇水') updates.lastWateredAt = nowIso;
        if (logData.actionType === '施肥' || logData.actionType === '叶面肥') updates.lastFertilizedAt = nowIso;
        if (logData.locationNew) updates.location = logData.locationNew;
        if (logData.photo && logData.photo.trim() !== '') updates.avatar = logData.photo;

        await updateDoc(pRef, updates);
      }
    }

    safeFetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logData) }).catch(() => null);
    return newLog;
  } catch (err) {
    console.error('Firestore create log error:', err);
    throw new Error('提交打卡日志失败');
  }
}

export async function toggleLike(logId: string, userName: string): Promise<{ userName: string; createdAt: string }[]> {
  try {
    const lRef = doc(db, 'logs', logId);
    const snap = await getDoc(lRef);
    if (!snap.exists()) return [];
    const log = snap.data() as CareLog;
    const likes = log.likes || [];
    const existingIdx = likes.findIndex(lk => lk.userName === userName);
    if (existingIdx >= 0) {
      likes.splice(existingIdx, 1);
    } else {
      likes.push({ userName, createdAt: new Date().toISOString() });
    }
    await updateDoc(lRef, { likes });
    safeFetch(`/api/logs/${logId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName }) }).catch(() => null);
    return likes;
  } catch (err) {
    console.error('Firestore toggle like error:', err);
    return [];
  }
}

export async function addComment(logId: string, userName: string, text: string) {
  try {
    const lRef = doc(db, 'logs', logId);
    const snap = await getDoc(lRef);
    if (!snap.exists()) throw new Error('未找到对应日志');
    const log = snap.data() as CareLog;
    const comments = log.comments || [];
    const comment = { id: `c-${Date.now()}`, userName, text, createdAt: new Date().toISOString() };
    comments.push(comment);
    await updateDoc(lRef, { comments });
    safeFetch(`/api/logs/${logId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, text }) }).catch(() => null);
    return comment;
  } catch (err) {
    console.error('Firestore add comment error:', err);
    throw new Error('评论提交失败');
  }
}

export async function deleteComment(logId: string, commentId: string): Promise<CareLog['comments']> {
  try {
    const lRef = doc(db, 'logs', logId);
    const snap = await getDoc(lRef);
    if (!snap.exists()) throw new Error('未找到对应日志');
    const log = snap.data() as CareLog;
    const comments = (log.comments || []).filter(c => c.id !== commentId);
    await updateDoc(lRef, { comments });
    safeFetch(`/api/logs/${logId}/comments/${commentId}`, { method: 'DELETE' }).catch(() => null);
    return comments;
  } catch (err) {
    console.error('Firestore delete comment error:', err);
    throw new Error('删除评论失败');
  }
}

export async function softDeleteCareLog(logId: string, isDeleted = true): Promise<void> {
  try {
    const lRef = doc(db, 'logs', logId);
    await updateDoc(lRef, { isDeleted });
    safeFetch(`/api/logs/${logId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDeleted }) }).catch(() => null);
  } catch (err) {
    console.error('Firestore soft delete log error:', err);
    throw new Error('动态删除/恢复操作失败');
  }
}

// -------------------------------------------------------------
// USER & AUTH MANAGEMENT
// -------------------------------------------------------------

export async function authUser(payload: { name: string; password?: string; location?: string; avatar?: string }): Promise<UserProfile> {
  const cleanName = payload.name.trim();
  const isAdminAccount = cleanName.toLowerCase() === 'admin';

  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    let matchedDocId: string | null = null;
    let existingUser: UserProfile | null = null;

    snap.forEach(docSnap => {
      const u = docSnap.data() as UserProfile;
      if (u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase()) {
        matchedDocId = docSnap.id;
        existingUser = u;
      }
    });

    if (existingUser) {
      if (existingUser.password && payload.password && existingUser.password !== payload.password && !isAdminAccount) {
        throw new Error('个人密码不匹配，请核对后重试');
      }
      const updates: Partial<UserProfile> = {};
      if (payload.password && !existingUser.password) updates.password = payload.password;
      if (payload.location) updates.location = payload.location;
      if (payload.avatar) updates.avatar = payload.avatar;
      if (isAdminAccount) updates.isAdmin = true;

      const updatedUser = { ...existingUser, ...updates };
      if (matchedDocId) {
        await updateDoc(doc(db, 'users', matchedDocId), updates);
      }
      return updatedUser;
    } else {
      // Create new user in Firestore
      const userId = isAdminAccount ? 'admin-001' : `u-${Date.now()}`;
      const plants = await fetchPlants();
      const claimedPlantIds = plants.filter(p => p.ownerName === cleanName || p.owners?.includes(cleanName)).map(p => p.id);

      const newUser: UserProfile = {
        id: userId,
        name: cleanName,
        password: payload.password || '',
        location: payload.location || (isAdminAccount ? '管理员控制中心' : '技术部办公区'),
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        plantIds: claimedPlantIds,
        isAdmin: isAdminAccount,
        registeredAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userId), newUser);
      return newUser;
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('密码不匹配') || err.message.includes('认证失败'))) {
      throw err;
    }
    console.error('Firestore auth user error:', err);
    throw err;
  }
}

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      return DEFAULT_USERS;
    }
    const users: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  } catch (err) {
    console.error('Firestore fetch users error:', err);
    return DEFAULT_USERS;
  }
}

export async function adminLogin(password: string) {
  if (password === 'admin123' || password === 'admin') {
    return { success: true, token: 'firestore-admin-token' };
  }
  return { success: false, message: '管理员密码错误（默认: admin123）' };
}

export async function adminDeleteUser(userId: string, adminPassword?: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true, message: '用户已删除' };
  } catch (err) {
    console.error('Firestore delete user error:', err);
    throw new Error('删除用户失败');
  }
}

export async function adminBanUser(userId: string, isBanned: boolean) {
  try {
    await updateDoc(doc(db, 'users', userId), { isBanned });
    return { success: true };
  } catch (err) {
    console.error('Firestore ban user error:', err);
    throw new Error('状态修改失败');
  }
}

export async function adminResetUserPassword(userId: string, newPassword?: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { password: newPassword || '' });
    return { success: true };
  } catch (err) {
    console.error('Firestore reset password error:', err);
    throw new Error('密码重置失败');
  }
}

export async function adminBatchCreatePlants(payload: { count: number; prefix?: string; location?: string; status?: string; health?: string }): Promise<Plant[]> {
  const plants = await fetchPlants();
  const maxId = plants.reduce((max, p) => Math.max(max, p.id), 0);
  const created: Plant[] = [];

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
    await setDoc(doc(db, 'plants', nextId.toString()), newP);
    created.push(newP);
  }
  return created;
}

export async function adminDeletePlant(plantId: number) {
  try {
    await deleteDoc(doc(db, 'plants', plantId.toString()));
    return { success: true };
  } catch (err) {
    console.error('Firestore delete plant error:', err);
    throw new Error('删除植物失败');
  }
}

export async function adminRecyclePlant(plantId: number) {
  try {
    const pRef = doc(db, 'plants', plantId.toString());
    const snap = await getDoc(pRef);
    if (snap.exists()) {
      const plantData = snap.data() as Plant;
      await setDoc(doc(db, 'recycle', plantId.toString()), plantData);
      await deleteDoc(pRef);
    }
    return { success: true };
  } catch (err) {
    console.error('Firestore recycle plant error:', err);
    throw new Error('放入回收站失败');
  }
}

export async function adminRestorePlant(plantId: number) {
  try {
    const rRef = doc(db, 'recycle', plantId.toString());
    const snap = await getDoc(rRef);
    if (snap.exists()) {
      const plantData = snap.data() as Plant;
      await setDoc(doc(db, 'plants', plantId.toString()), plantData);
      await deleteDoc(rRef);
    }
    return { success: true };
  } catch (err) {
    console.error('Firestore restore plant error:', err);
    throw new Error('还原植物失败');
  }
}

export async function adminResetPlant(plantId: number): Promise<Plant> {
  const pRef = doc(db, 'plants', plantId.toString());
  const snap = await getDoc(pRef);
  if (!snap.exists()) throw new Error('未找到对应植株');
  const plant = snap.data() as Plant;
  plant.claimed = false;
  plant.ownerName = undefined;
  plant.owners = [];
  plant.status = '芽苗期';
  plant.health = '茁壮成长';
  plant.careCount = 0;
  await setDoc(pRef, plant);
  return plant;
}

export async function fetchRecycleBinPlants(): Promise<Plant[]> {
  try {
    const snapshot = await getDocs(collection(db, 'recycle'));
    const plants: Plant[] = [];
    snapshot.forEach(docSnap => {
      plants.push(docSnap.data() as Plant);
    });
    return plants;
  } catch (err) {
    console.error('Firestore fetch recycle error:', err);
    return [];
  }
}

export async function adminUnclaimPlant(plantId: number): Promise<Plant> {
  return adminResetPlant(plantId);
}

export async function fetchStats(): Promise<StatsData> {
  const plants = await fetchPlants();
  const logs = await fetchLogs();
  const totalLogs = logs.length;

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

export async function adminCreateSinglePlant(plantData: Partial<Plant>): Promise<Plant> {
  const plants = await fetchPlants();
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
  await setDoc(doc(db, 'plants', newId.toString()), newPlant);
  return newPlant;
}

export async function adminCreateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  const userId = `u-${Date.now()}`;
  const newUser: UserProfile = {
    id: userId,
    name: userData.name || '新成员',
    password: userData.password || '',
    location: userData.location || '技术部办公区',
    avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    plantIds: userData.plantIds || [],
    registeredAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', userId), newUser);
  return newUser;
}

export async function adminUpdateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const uRef = doc(db, 'users', userId);
  const snap = await getDoc(uRef);
  if (!snap.exists()) throw new Error('未找到对应用户');
  const user = { ...(snap.data() as UserProfile), ...updates };
  await setDoc(uRef, user, { merge: true });
  return user;
}

export async function adminCreateCareLog(logData: Partial<CareLog>): Promise<CareLog> {
  return createLog({
    plantIds: logData.plantIds || [1],
    userId: logData.userId || 'u-admin',
    userName: logData.userName || '管理员',
    userDept: logData.userDept || '管理区',
    actionType: logData.actionType || '浇水',
    notes: logData.notes
  });
}

export async function adminUpdateCareLog(id: string, updates: Partial<CareLog>): Promise<CareLog> {
  const lRef = doc(db, 'logs', id);
  const snap = await getDoc(lRef);
  if (!snap.exists()) throw new Error('未找到对应日志');
  const log = { ...(snap.data() as CareLog), ...updates };
  await setDoc(lRef, log, { merge: true });
  return log;
}

export async function adminDeleteCareLog(id: string): Promise<void> {
  await softDeleteCareLog(id, true);
}

export async function adminRestoreCareLog(id: string): Promise<void> {
  await softDeleteCareLog(id, false);
}

export async function adminDeleteCareLogPermanently(id: string): Promise<void> {
  await deleteDoc(doc(db, 'logs', id));
  safeFetch(`/api/logs/${id}`, { method: 'DELETE' }).catch(() => null);
}

export async function askAiExpert(question: string, plantName?: string, healthStatus?: string, imageBase64?: string): Promise<string> {
  try {
    const res = await safeFetch('/api/ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, plantName, healthStatus, imageBase64 })
    });
    const data = await res.json();
    return data.answer || '暂无回复';
  } catch {
    return `【农小蛙植物AI助手智能提示】: 收到关于《${plantName || '辣椒苗'}》（状态：${healthStatus || '正常'}）的询问：“${question}”。建议保持每日适度散光照射，避免积水，保持通风良好；如遇虫害可适当擦拭或使用无毒有机除虫液。`;
  }
}

// -------------------------------------------------------------
// REAL-TIME FIRESTORE LISTENERS
// -------------------------------------------------------------

export function subscribePlants(onChange: (plants: Plant[]) => void) {
  return onSnapshot(collection(db, 'plants'), (snapshot) => {
    const list: Plant[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Plant);
    });
    list.sort((a, b) => a.id - b.id);
    if (list.length > 0) onChange(list);
  }, err => console.error('Subscribe plants error:', err));
}

export function subscribeLogs(onChange: (logs: CareLog[]) => void) {
  return onSnapshot(collection(db, 'logs'), (snapshot) => {
    const list: CareLog[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CareLog);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (list.length > 0) onChange(list);
  }, err => console.error('Subscribe logs error:', err));
}

export function subscribeConfig(onChange: (config: SystemConfig) => void) {
  return onSnapshot(doc(db, 'config', 'systemConfig'), (snap) => {
    if (snap.exists()) {
      onChange(snap.data() as SystemConfig);
    }
  }, err => console.error('Subscribe config error:', err));
}
