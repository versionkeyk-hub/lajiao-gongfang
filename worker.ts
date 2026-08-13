import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ─── Types ───────────────────────────────────────────────
interface Plant {
  id: number;
  code: string;
  name: string;
  claimed: boolean;
  ownerName?: string;
  owners: string[];
  primaryDept: string;
  location: string;
  status: string;
  health: string;
  plantedDate: string;
  avatar: string;
  initialAvatar: string;
  careCount: number;
  lastWateredAt?: string;
  lastFertilizedAt?: string;
  lastCareAt?: string;
  notes?: string;
  isDeleted?: boolean;
}

interface CareLog {
  id: string;
  plantIds: number[];
  userId: string;
  userName: string;
  userDept?: string;
  userLocation?: string;
  userAvatar?: string;
  actionType: string;
  actionIcon: string;
  fertilizerName?: string;
  fertilizerConcentration?: string;
  locationNew?: string;
  waterVolume?: string;
  photo?: string;
  notes?: string;
  helpedColleagues?: string[];
  createdAt: string;
  likes: { userName: string; createdAt: string }[];
  comments: { id: string; userName: string; text: string; createdAt: string }[];
}

interface UserProfile {
  id: string;
  name: string;
  password?: string;
  dept?: string;
  location?: string;
  avatar?: string;
  plantIds?: number[];
  isAdmin?: boolean;
  isBanned?: boolean;
  registeredAt: string;
}

interface SystemActionTypeConfig {
  id: string;
  key: string;
  label: string;
  icon: string;
  colorBg?: string;
  colorText?: string;
  description?: string;
  enableWaterInput?: boolean;
  enableFertilizerInput?: boolean;
  enableLocationInput?: boolean;
}

interface SystemConfig {
  actionTypes: SystemActionTypeConfig[];
  growthStages: string[];
  healthStatuses: string[];
  locations: string[];
  fertilizers: string[];
}

interface DBData {
  plants: Plant[];
  logs: CareLog[];
  users: UserProfile[];
  systemConfig?: SystemConfig;
}

interface Env {
  DB: R2Bucket;
  ASSETS: Fetcher;
}

// ─── Default Data ────────────────────────────────────────
const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  actionTypes: [
    { id: 'act-1', key: '浇水', label: '浇水', icon: '💧', colorBg: 'bg-blue-100', colorText: 'text-blue-800', enableWaterInput: true, description: '灌溉补水操作' },
    { id: 'act-2', key: '施肥', label: '施肥', icon: '🧪', colorBg: 'bg-amber-100', colorText: 'text-amber-800', enableFertilizerInput: true, description: '根部施肥或水溶肥' },
    { id: 'act-3', key: '叶面肥', label: '叶面肥', icon: '🌱', colorBg: 'bg-emerald-100', colorText: 'text-emerald-800', enableFertilizerInput: true, description: '叶面喷施微量元素' },
    { id: 'act-4', key: '松土培土', label: '松土培土', icon: '🌾', colorBg: 'bg-orange-100', colorText: 'text-orange-800', description: '疏松土壤增加透气性' },
    { id: 'act-5', key: '打药防虫', label: '打药防虫', icon: '🐛', colorBg: 'bg-purple-100', colorText: 'text-purple-800', description: '病虫害药剂喷洒' },
    { id: 'act-6', key: '打顶剪枝', label: '打顶剪枝', icon: '✂️', colorBg: 'bg-teal-100', colorText: 'text-teal-800', description: '摘心打顶修剪枝叶' },
    { id: 'act-7', key: '位置变更', label: '位置变更', icon: '📍', colorBg: 'bg-rose-100', colorText: 'text-rose-800', enableLocationInput: true, description: '挪动花盆摆放位置' },
    { id: 'act-8', key: '成长拍照', label: '成长拍照', icon: '📷', colorBg: 'bg-indigo-100', colorText: 'text-indigo-800', description: '拍照记录生长阶段' },
    { id: 'act-9', key: '日光照射', label: '日光照射', icon: '☀️', colorBg: 'bg-yellow-100', colorText: 'text-yellow-800', description: '移至日光充沛区补光' },
    { id: 'act-10', key: '除草清理', label: '除草清理', icon: '🌿', colorBg: 'bg-lime-100', colorText: 'text-lime-800', description: '清理杂草及枯叶' },
    { id: 'act-11', key: '换盆翻土', label: '换盆翻土', icon: '🪴', colorBg: 'bg-stone-100', colorText: 'text-stone-800', description: '更换更大花盆和营养土' },
    { id: 'act-12', key: '采摘收获', label: '采摘收获', icon: '🌶️', colorBg: 'bg-red-100', colorText: 'text-red-800', description: '采摘成熟辣椒果实' },
    { id: 'act-13', key: '人工授粉', label: '人工授粉', icon: '🌸', colorBg: 'bg-fuchsia-100', colorText: 'text-fuchsia-800', description: '人工辅助开花授粉' },
    { id: 'act-14', key: '互助照顾', label: '互助照顾', icon: '🤝', colorBg: 'bg-cyan-100', colorText: 'text-cyan-800', description: '领用责任人交接或代照顾' }
  ],
  growthStages: ['芽苗期', '幼苗期', '生长期', '花蕾期', '挂果期', '采收期', '休眠期'],
  healthStatuses: ['茁壮成长', '需要浇水', '需要施肥', '观察中', '病虫害防护', '病害隔离中', '日灼恢复中'],
  locations: ['技术部办公区', '财务办公区', '大厅展现区', '直播间', '自媒体办公区', '人事办公室', '前台与休息区'],
  fertilizers: ['磷酸二氢钾', '通用型复合肥', '水溶育苗肥', '羊粪有机肥', '奥绿缓释肥', '自制发酵液', '硝酸钾叶面肥']
};

const DEFAULT_IMG_1 = 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80';
const DEFAULT_IMG_2 = 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80';
const DEFAULT_IMG_3 = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80';
const DEFAULT_IMG_4 = 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80';
const DEFAULT_IMG_5 = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';

function nowISO(): string {
  return new Date().toISOString();
}

function initialPlants(): Plant[] {
  const now = Date.now();
  return [
    { id: 1, code: '辣椒 #01', name: '辣椒 #01', claimed: true, ownerName: '张伟', owners: ['张伟'], primaryDept: '技术部办公区', location: '技术部办公区', status: '生长期', health: '茁壮成长', plantedDate: '2026-08-01', avatar: DEFAULT_IMG_1, initialAvatar: DEFAULT_IMG_1, careCount: 12, lastWateredAt: new Date(now - 3600000 * 4).toISOString(), lastFertilizedAt: new Date(now - 3600000 * 48).toISOString(), lastCareAt: new Date(now - 3600000 * 4).toISOString(), notes: '一号朝天椒长势迅猛，顶端已经冒出第二对真叶！' },
    { id: 2, code: '辣椒 #02', name: '辣椒 #02', claimed: true, ownerName: '李娜', owners: ['李娜'], primaryDept: '财务办公区', location: '财务办公区', status: '定植期', health: '需要浇水', plantedDate: '2026-08-01', avatar: DEFAULT_IMG_2, initialAvatar: DEFAULT_IMG_2, careCount: 8, lastWateredAt: new Date(now - 3600000 * 30).toISOString(), lastFertilizedAt: new Date(now - 3600000 * 72).toISOString(), lastCareAt: new Date(now - 3600000 * 30).toISOString(), notes: '放在财务窗口，晒太阳充足。' },
    { id: 3, code: '辣椒 #03', name: '辣椒 #03', claimed: true, ownerName: '王强', owners: ['王强'], primaryDept: '直播间', location: '直播间', status: '生长期', health: '茁壮成长', plantedDate: '2026-08-01', avatar: DEFAULT_IMG_3, initialAvatar: DEFAULT_IMG_3, careCount: 15, lastWateredAt: new Date(now - 3600000 * 2).toISOString(), lastFertilizedAt: new Date(now - 3600000 * 24).toISOString(), lastCareAt: new Date(now - 3600000 * 2).toISOString(), notes: '直播间环境适宜，生长期形态端正。' },
    { id: 4, code: '辣椒 #04', name: '辣椒 #04', claimed: false, owners: [], primaryDept: '人事办公室', location: '人事办公室', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-01', avatar: DEFAULT_IMG_4, initialAvatar: DEFAULT_IMG_4, careCount: 3, lastCareAt: new Date(now - 3600000 * 8).toISOString(), notes: '人事办前台待认领。' },
    { id: 5, code: '辣椒 #05', name: '辣椒 #05', claimed: false, owners: [], primaryDept: '大厅展现区', location: '大厅展现区', status: '芽苗期', health: '需要施肥', plantedDate: '2026-08-02', avatar: DEFAULT_IMG_5, initialAvatar: DEFAULT_IMG_5, careCount: 5, lastCareAt: new Date(now - 3600000 * 12).toISOString(), notes: '大厅采光区待领用。' },
    { id: 6, code: '辣椒 #06', name: '辣椒 #06', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-02', avatar: DEFAULT_IMG_1, initialAvatar: DEFAULT_IMG_1, careCount: 2 },
    { id: 7, code: '辣椒 #07', name: '辣椒 #07', claimed: false, owners: [], primaryDept: '自媒体办公区', location: '自媒体办公区', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-02', avatar: DEFAULT_IMG_1, initialAvatar: DEFAULT_IMG_1, careCount: 4 },
    { id: 8, code: '辣椒 #08', name: '辣椒 #08', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区', status: '芽苗期', health: '观察中', plantedDate: '2026-08-02', avatar: DEFAULT_IMG_2, initialAvatar: DEFAULT_IMG_2, careCount: 1 },
    { id: 9, code: '辣椒 #09', name: '辣椒 #09', claimed: false, owners: [], primaryDept: '财务办公区', location: '财务办公区', status: '芽苗期', health: '需要浇水', plantedDate: '2026-08-03', avatar: DEFAULT_IMG_3, initialAvatar: DEFAULT_IMG_3, careCount: 1 },
    { id: 10, code: '辣椒 #10', name: '辣椒 #10', claimed: false, owners: [], primaryDept: '大厅展现区', location: '大厅展现区', status: '定植期', health: '茁壮成长', plantedDate: '2026-08-03', avatar: DEFAULT_IMG_4, initialAvatar: DEFAULT_IMG_4, careCount: 3 },
    { id: 11, code: '辣椒 #11', name: '辣椒 #11', claimed: false, owners: [], primaryDept: '人事办公室', location: '人事办公室', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-03', avatar: DEFAULT_IMG_5, initialAvatar: DEFAULT_IMG_5, careCount: 2 },
    { id: 12, code: '辣椒 #12', name: '辣椒 #12', claimed: false, owners: [], primaryDept: '自媒体办公区', location: '自媒体办公区', status: '芽苗期', health: '需要施肥', plantedDate: '2026-08-04', avatar: DEFAULT_IMG_1, initialAvatar: DEFAULT_IMG_1, careCount: 2 },
    { id: 13, code: '辣椒 #13', name: '辣椒 #13', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-04', avatar: DEFAULT_IMG_1, initialAvatar: DEFAULT_IMG_1, careCount: 1 },
    { id: 14, code: '辣椒 #14', name: '辣椒 #14', claimed: false, owners: [], primaryDept: '财务办公区', location: '财务办公区', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-04', avatar: DEFAULT_IMG_2, initialAvatar: DEFAULT_IMG_2, careCount: 2 },
    { id: 15, code: '辣椒 #15', name: '辣椒 #15', claimed: false, owners: [], primaryDept: '大厅展现区', location: '大厅展现区', status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-05', avatar: DEFAULT_IMG_3, initialAvatar: DEFAULT_IMG_3, careCount: 3 }
  ];
}

function initialLogs(): CareLog[] {
  const now = Date.now();
  return [
    {
      id: 'log-101', plantIds: [1], userId: 'u-1', userName: '张伟', userDept: '技术部办公区',
      actionType: '浇水', actionIcon: '💧', waterVolume: '250ml 晾晒透水',
      notes: '早上巡视给1号辣苗补足了水分，土壤透气性良好。',
      createdAt: new Date(now - 3600000 * 4).toISOString(),
      likes: [{ userName: '李娜', createdAt: nowISO() }, { userName: '王强', createdAt: nowISO() }],
      comments: [{ id: 'c-1', userName: '李娜', text: '张工太勤快了！', createdAt: nowISO() }]
    },
    {
      id: 'log-102', plantIds: [3, 2], userId: 'u-3', userName: '王强', userDept: '直播间',
      actionType: '施肥', actionIcon: '🧪', fertilizerName: '磷酸二氢钾', fertilizerConcentration: '1:1000 稀释液',
      helpedColleagues: ['李娜'],
      notes: '给自己的辣苗 #03 施了薄肥，顺便给隔壁李娜的2号辣苗也淋了一点！',
      createdAt: new Date(now - 3600000 * 7).toISOString(),
      likes: [{ userName: '李娜', createdAt: nowISO() }, { userName: '张伟', createdAt: nowISO() }],
      comments: [{ id: 'c-2', userName: '李娜', text: '谢谢强哥照顾！给你点赞👍', createdAt: nowISO() }]
    }
  ];
}

function initialDB(): DBData {
  return {
    plants: initialPlants(),
    logs: initialLogs(),
    users: [
      { id: 'u-1', name: '张伟', password: '123', location: '技术部办公区', plantIds: [1], registeredAt: '2026-08-01' },
      { id: 'u-2', name: '李娜', password: '123', location: '财务办公区', plantIds: [2], registeredAt: '2026-08-01' },
      { id: 'u-3', name: '王强', password: '123', location: '直播间', plantIds: [3], registeredAt: '2026-08-01' }
    ],
    systemConfig: DEFAULT_SYSTEM_CONFIG
  };
}

// ─── R2 DB Helpers ───────────────────────────────────────
const DB_KEY = 'pepper_db.json';

async function loadDB(env: Env): Promise<DBData> {
  const obj = await env.DB.get(DB_KEY);
  if (!obj) {
    const data = initialDB();
    await env.DB.put(DB_KEY, JSON.stringify(data));
    return data;
  }
  const text = await obj.text();
  const data = JSON.parse(text) as DBData;

  // Migrate / ensure system config has all standard action types
  if (!data.systemConfig || !Array.isArray(data.systemConfig.actionTypes) || data.systemConfig.actionTypes.length < 14) {
    const existingLabels = new Set((data.systemConfig?.actionTypes || []).map(a => a.label || a.key));
    const missingStandard = DEFAULT_SYSTEM_CONFIG.actionTypes.filter(def => !existingLabels.has(def.label) && !existingLabels.has(def.key));
    data.systemConfig = {
      ...DEFAULT_SYSTEM_CONFIG,
      ...data.systemConfig,
      actionTypes: [...(data.systemConfig?.actionTypes || []), ...missingStandard]
    };
    await env.DB.put(DB_KEY, JSON.stringify(data));
  }
  return data;
}

async function saveDB(env: Env, data: DBData): Promise<void> {
  await env.DB.put(DB_KEY, JSON.stringify(data));
}

// ─── Hono App ────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ─── 1. GET /api/plants ──────────────────────────────────
app.get('/api/plants', async (c) => {
  const db = await loadDB(c.env);
  const activePlants = db.plants.filter(p => !p.isDeleted).map(p => {
    const plantLogs = db.logs ? db.logs.filter(l => l.plantIds && Array.isArray(l.plantIds) && l.plantIds.includes(p.id)) : [];
    const logCount = plantLogs.length;
    let latestPhoto = p.avatar;
    if (plantLogs.length > 0) {
      const logsWithPhoto = plantLogs.filter(l => l.photo && l.photo.trim() !== '');
      if (logsWithPhoto.length > 0) {
        logsWithPhoto.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (logsWithPhoto[0].photo) latestPhoto = logsWithPhoto[0].photo;
      }
    }
    return { ...p, avatar: latestPhoto, careCount: Math.max(p.careCount || 0, logCount) };
  });
  return c.json({ success: true, plants: activePlants });
});

// ─── 2. PUT /api/plants/:id ──────────────────────────────
app.put('/api/plants/:id', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const index = db.plants.findIndex(p => p.id === plantId);
  if (index === -1) return c.json({ success: false, message: '找不到对应的植株' }, 404);
  const body = await c.req.json();
  const updatedPlant = { ...db.plants[index], ...body };
  db.plants[index] = updatedPlant;
  await saveDB(c.env, db);
  return c.json({ success: true, plant: updatedPlant });
});

// ─── 3. POST /api/plants/:id/claim ───────────────────────
app.post('/api/plants/:id/claim', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const { userId, userName, location } = await c.req.json();
  if (!userName) return c.json({ success: false, message: '请提供领用人姓名' }, 400);

  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '找不到此盆植株' }, 404);

  if (plant.claimed || (plant.ownerName && plant.ownerName.trim() !== '')) {
    return c.json({ success: false, message: `该植株编号与二维码【${plant.code}】已被【${plant.ownerName || '他人'}】成功认领绑定！每一个二维码与编号只能被认领一次，无法重复认领绑定！` }, 400);
  }

  plant.claimed = true;
  plant.ownerName = userName;
  plant.owners = [userName];
  if (location) plant.location = location;

  let user = db.users.find(u => u.name === userName);
  if (user) {
    if (!user.plantIds) user.plantIds = [];
    if (!user.plantIds.includes(plantId)) user.plantIds.push(plantId);
  } else {
    user = {
      id: userId || 'u-' + Date.now(), name: userName, password: '123',
      location: location || '养护区域', plantIds: [plantId],
      registeredAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(user);
  }

  await saveDB(c.env, db);
  return c.json({ success: true, plant, user });
});

// ─── 4. POST /api/plants/transfer ────────────────────────
app.post('/api/plants/transfer', async (c) => {
  const { plantId, fromUserName, toUserName, reason } = await c.req.json();
  if (!plantId || !fromUserName || !toUserName) return c.json({ success: false, message: '转让参数不完整' }, 400);

  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '盆栽未找到' }, 404);

  plant.claimed = true;
  plant.ownerName = toUserName;
  plant.owners = [toUserName];

  let toUser = db.users.find(u => u.name === toUserName);
  if (toUser) {
    if (!toUser.plantIds) toUser.plantIds = [];
    if (!toUser.plantIds.includes(plantId)) toUser.plantIds.push(plantId);
  } else {
    db.users.push({
      id: 'u-' + Date.now(), name: toUserName, password: '123',
      location: plant.location || '养护区域', plantIds: [plantId],
      registeredAt: new Date().toISOString().split('T')[0]
    });
  }

  const transferLog: CareLog = {
    id: 'log-' + Date.now(), plantIds: [plantId], userId: 'system', userName: fromUserName,
    actionType: '所有权转移', actionIcon: '🎁',
    notes: `【所有权转移】${fromUserName} 已将 ${plant.code} 的所有权登记转让给【${toUserName}】。原因：${reason || '交接照顾'}`,
    createdAt: nowISO(), likes: [], comments: []
  };
  db.logs.unshift(transferLog);
  await saveDB(c.env, db);
  return c.json({ success: true, plant, log: transferLog });
});

// ─── 5. GET /api/logs ────────────────────────────────────
app.get('/api/logs', async (c) => {
  const { plantId, actionType, search } = c.req.query();
  const db = await loadDB(c.env);
  let filtered = [...db.logs];

  if (plantId) {
    const pid = parseInt(plantId);
    filtered = filtered.filter(l => l.plantIds.includes(pid));
  }
  if (actionType && actionType !== '全部') {
    filtered = filtered.filter(l => l.actionType === actionType);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(l => l.userName.toLowerCase().includes(term) || (l.notes?.toLowerCase().includes(term)));
  }
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ success: true, logs: filtered });
});

// ─── 6. POST /api/logs ───────────────────────────────────
app.post('/api/logs', async (c) => {
  const body = await c.req.json();
  const { plantIds, userId, userName, userLocation, userAvatar, actionType, fertilizerName, fertilizerConcentration, locationNew, waterVolume, photo, notes, helpedColleagues } = body;

  if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0 || !userName) {
    return c.json({ success: false, message: '请填写打卡必要参数' }, 400);
  }

  const db = await loadDB(c.env);
  const actionIcons: Record<string, string> = {
    '浇水': '💧', '施肥': '🧪', '叶面肥': '🍃', '松土': '🌱', '定植': '🪴',
    '打药': '🐛', '打顶剪枝': '✂️', '位置变更': '📍', '成长拍照': '📸',
    '晒太阳': '☀️', '所有权转移': '🎁'
  };

  const newLog: CareLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    plantIds, userId: userId || 'user-' + Date.now(), userName,
    userDept: userLocation || '养护区域', userLocation: userLocation || '养护区域', userAvatar,
    actionType, actionIcon: actionIcons[actionType] || '📝',
    fertilizerName, fertilizerConcentration, locationNew, waterVolume, photo, notes,
    helpedColleagues: helpedColleagues || [], createdAt: nowISO(), likes: [], comments: []
  };

  db.logs.unshift(newLog);
  plantIds.forEach((pid: number) => {
    const plant = db.plants.find(p => p.id === pid);
    if (plant) {
      plant.careCount = (plant.careCount || 0) + 1;
      plant.lastCareAt = nowISO();
      if (actionType === '浇水') { plant.lastWateredAt = nowISO(); if (plant.health === '需要浇水') plant.health = '茁壮成长'; }
      else if (actionType === '施肥' || actionType === '叶面肥') { plant.lastFertilizedAt = nowISO(); if (plant.health === '需要施肥') plant.health = '茁壮成长'; }
      else if (actionType === '位置变更' && locationNew) { plant.location = locationNew; }
      if (photo && photo.trim() !== '') { plant.avatar = photo; }
    }
  });

  await saveDB(c.env, db);
  return c.json({ success: true, log: newLog });
});

// ─── 7. POST /api/logs/:id/like ──────────────────────────
app.post('/api/logs/:id/like', async (c) => {
  const logId = c.req.param('id');
  const { userName } = await c.req.json();
  if (!userName) return c.json({ success: false, message: '需要姓名' }, 400);

  const db = await loadDB(c.env);
  const log = db.logs.find(l => l.id === logId);
  if (!log) return c.json({ success: false, message: '动态不存在' }, 404);

  const existingIndex = log.likes.findIndex(lk => lk.userName === userName);
  if (existingIndex >= 0) { log.likes.splice(existingIndex, 1); }
  else { log.likes.push({ userName, createdAt: nowISO() }); }

  await saveDB(c.env, db);
  return c.json({ success: true, likes: log.likes });
});

// ─── 8. POST /api/logs/:id/comments ──────────────────────
app.post('/api/logs/:id/comments', async (c) => {
  const logId = c.req.param('id');
  const { userName, text } = await c.req.json();
  if (!userName || !text) return c.json({ success: false, message: '请填写评论内容' }, 400);

  const db = await loadDB(c.env);
  const log = db.logs.find(l => l.id === logId);
  if (!log) return c.json({ success: false, message: '动态不存在' }, 404);

  const comment = { id: 'c-' + Date.now(), userName, text, createdAt: nowISO() };
  log.comments.push(comment);
  await saveDB(c.env, db);
  return c.json({ success: true, comment });
});

// ─── 9. POST /api/auth ───────────────────────────────────
app.post('/api/auth', async (c) => {
  const { name, password, location, avatar } = await c.req.json();
  if (!name || !name.trim()) return c.json({ success: false, message: '请输入姓名' }, 400);

  const trimmedName = name.trim();
  const pwd = password ? password.trim() : '123';

  if (trimmedName.toLowerCase() === 'admin') {
    const adminUser = { id: 'admin-001', name: 'admin', password: pwd || '123', isAdmin: true, location: '管理员控制中心', registeredAt: '2026-08-01' };
    const db = await loadDB(c.env);
    let existingAdmin = db.users.find(u => u.name.toLowerCase() === 'admin');
    if (existingAdmin) { existingAdmin.isAdmin = true; existingAdmin.password = pwd || '123'; await saveDB(c.env, db); }
    else { db.users.push(adminUser); await saveDB(c.env, db); }
    return c.json({ success: true, user: adminUser });
  }

  const db = await loadDB(c.env);
  let user = db.users.find(u => u.name === trimmedName);

  if (user) {
    if (user.isBanned) return c.json({ success: false, message: '该账号已被管理员封禁，无法登录！如需解封请联系管理员。' }, 403);
    if (user.password && user.password !== pwd) return c.json({ success: false, message: '密码错误！请输入正确的个人密码。' }, 401);
    user.password = pwd;
    if (location) user.location = location;
    if (avatar) user.avatar = avatar;
  } else {
    user = {
      id: 'u-' + Date.now(), name: trimmedName, password: pwd,
      location: location || '养护区域', avatar, plantIds: [],
      isAdmin: false, isBanned: false,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(user);
  }

  await saveDB(c.env, db);
  return c.json({ success: true, user });
});

// ─── 10. GET /api/users ──────────────────────────────────
app.get('/api/users', async (c) => {
  const db = await loadDB(c.env);
  return c.json({ success: true, users: db.users });
});

// ─── 11. POST /api/admin/login ───────────────────────────
app.post('/api/admin/login', async (c) => {
  const { password } = await c.req.json();
  if (password === '123' || password === 'admin123') return c.json({ success: true });
  return c.json({ success: false, message: '管理员密码错误！' }, 401);
});

// ─── 12. Admin: reset password ───────────────────────────
app.post('/api/admin/users/:userId/reset-password', async (c) => {
  const { userId } = c.req.param();
  const { newPassword } = await c.req.json();
  const db = await loadDB(c.env);
  const user = db.users.find(u => u.id === userId);
  if (!user) return c.json({ success: false, message: '成员不存在' }, 404);
  user.password = newPassword || '888888';
  await saveDB(c.env, db);
  return c.json({ success: true, message: `已成功重置成员【${user.name}】的密码为：${user.password}` });
});

// ─── 13. Admin: ban/unban ────────────────────────────────
app.post('/api/admin/users/:userId/ban', async (c) => {
  const { userId } = c.req.param();
  const { isBanned } = await c.req.json();
  const db = await loadDB(c.env);
  const user = db.users.find(u => u.id === userId);
  if (!user) return c.json({ success: false, message: '成员不存在' }, 404);
  if (user.isAdmin) return c.json({ success: false, message: '不能封禁管理员账号' }, 400);
  user.isBanned = !!isBanned;
  await saveDB(c.env, db);
  return c.json({ success: true, user, message: isBanned ? `已封禁成员【${user.name}】` : `已解封成员【${user.name}】` });
});

// ─── 14. Admin: delete user ──────────────────────────────
app.delete('/api/admin/users/:userId', async (c) => {
  const { userId } = c.req.param();
  const db = await loadDB(c.env);
  const index = db.users.findIndex(u => u.id === userId);
  if (index === -1) return c.json({ success: false, message: '成员不存在' }, 404);
  const targetUser = db.users[index];
  db.plants.forEach(p => {
    if (p.ownerName === targetUser.name || p.owners.includes(targetUser.name)) {
      p.claimed = false; p.ownerName = undefined; p.owners = [];
    }
  });
  db.users.splice(index, 1);
  await saveDB(c.env, db);
  return c.json({ success: true, message: `已成功删除成员【${targetUser.name}】` });
});

// ─── 15. Admin: unclaim plant ────────────────────────────
app.post('/api/admin/plants/:id/unclaim', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '植株未找到' }, 404);
  plant.claimed = false; plant.ownerName = undefined; plant.owners = [];
  await saveDB(c.env, db);
  return c.json({ success: true, plant });
});

// ─── 16. Admin: batch create plants ──────────────────────
app.post('/api/admin/plants/batch-create', async (c) => {
  const body = await c.req.json();
  const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 50);
  const prefix = body.prefix || '辣椒';
  const location = body.location || '技术部办公区';
  const status = body.status || '芽苗期';
  const health = body.health || '茁壮成长';

  const db = await loadDB(c.env);
  let maxId = 0;
  db.plants.forEach(p => { if (p.id > maxId) maxId = p.id; });

  const defaultImages = [DEFAULT_IMG_1, DEFAULT_IMG_2, DEFAULT_IMG_3, DEFAULT_IMG_4, DEFAULT_IMG_5];
  const createdPlants: Plant[] = [];

  for (let i = 1; i <= count; i++) {
    const newId = maxId + i;
    const padNum = newId < 10 ? `0${newId}` : `${newId}`;
    const code = `${prefix} #${padNum}`;
    const img = defaultImages[(newId - 1) % defaultImages.length];
    const newPlant: Plant = {
      id: newId, code, name: code, claimed: false, owners: [],
      primaryDept: location, location, status, health,
      plantedDate: new Date().toISOString().split('T')[0],
      avatar: img, initialAvatar: img, careCount: 0
    };
    db.plants.push(newPlant);
    createdPlants.push(newPlant);
  }

  await saveDB(c.env, db);
  return c.json({ success: true, plants: createdPlants, message: `已成功批量增加 ${count} 盆辣椒苗！` });
});

// ─── 17. Admin: recycle plant ────────────────────────────
app.post('/api/admin/plants/:id/recycle', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '找不到此植物' }, 404);
  plant.isDeleted = true;
  await saveDB(c.env, db);
  return c.json({ success: true, message: `已将植物【${plant.code}】移入垃圾桶` });
});

// ─── 18. Admin: restore plant ────────────────────────────
app.post('/api/admin/plants/:id/restore', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '找不到此植物' }, 404);
  plant.isDeleted = false;
  await saveDB(c.env, db);
  return c.json({ success: true, message: `已将植物【${plant.code}】从垃圾桶恢复！` });
});

// ─── 19. Admin: reset plant ──────────────────────────────
app.post('/api/admin/plants/:id/reset', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return c.json({ success: false, message: '找不到此植物' }, 404);
  plant.claimed = false; plant.ownerName = undefined; plant.owners = [];
  plant.status = '芽苗期'; plant.health = '茁壮成长'; plant.careCount = 0;
  plant.lastWateredAt = undefined; plant.lastFertilizedAt = undefined;
  plant.lastCareAt = undefined; plant.notes = undefined; plant.isDeleted = false;
  if (plant.initialAvatar) plant.avatar = plant.initialAvatar;
  await saveDB(c.env, db);
  return c.json({ success: true, plant, message: `已成功将植物【${plant.code}】重置为初始状态！` });
});

// ─── 20. Admin: get recycle bin ──────────────────────────
app.get('/api/admin/recycle-bin', async (c) => {
  const db = await loadDB(c.env);
  const deletedPlants = db.plants.filter(p => p.isDeleted);
  return c.json({ success: true, plants: deletedPlants });
});

// ─── 21. Admin: permanent delete plant ───────────────────
app.delete('/api/admin/plants/:id', async (c) => {
  const plantId = parseInt(c.req.param('id'));
  const db = await loadDB(c.env);
  const index = db.plants.findIndex(p => p.id === plantId);
  if (index === -1) return c.json({ success: false, message: '找不到此植物' }, 404);
  const targetPlant = db.plants[index];
  db.plants.splice(index, 1);
  await saveDB(c.env, db);
  return c.json({ success: true, message: `已永久删除植物【${targetPlant.code}】` });
});

// ─── 22. Admin: create single plant ──────────────────────
app.post('/api/admin/plants', async (c) => {
  const body = await c.req.json();
  const db = await loadDB(c.env);
  let maxId = 0;
  db.plants.forEach(p => { if (p.id > maxId) maxId = p.id; });
  const newId = maxId + 1;
  const padNum = newId < 10 ? `0${newId}` : `${newId}`;
  const defaultImg = DEFAULT_IMG_1;

  const newPlant: Plant = {
    id: newId,
    code: body.code || `辣椒 #${padNum}`,
    name: body.name || `辣椒 #${padNum}`,
    claimed: !!body.claimed,
    ownerName: body.ownerName || undefined,
    owners: Array.isArray(body.owners) ? body.owners : (body.ownerName ? [body.ownerName] : []),
    primaryDept: body.primaryDept || '办公区',
    location: body.location || '办公区',
    status: body.status || '芽苗期',
    health: body.health || '茁壮成长',
    plantedDate: body.plantedDate || new Date().toISOString().split('T')[0],
    avatar: body.avatar || defaultImg,
    initialAvatar: body.initialAvatar || body.avatar || defaultImg,
    careCount: typeof body.careCount === 'number' ? body.careCount : 0,
    notes: body.notes || undefined,
    isDeleted: false
  };

  db.plants.push(newPlant);
  await saveDB(c.env, db);
  return c.json({ success: true, plant: newPlant, message: `已成功添加植株【${newPlant.code}】` });
});

// ─── 23. Admin: create user ──────────────────────────────
app.post('/api/admin/users', async (c) => {
  const body = await c.req.json();
  const name = body.name?.trim();
  if (!name) return c.json({ success: false, message: '必须填写成员姓名' }, 400);
  const db = await loadDB(c.env);
  if (db.users.some(u => u.name === name)) return c.json({ success: false, message: `成员【${name}】已存在，请使用其他姓名` }, 400);

  const newUser: UserProfile = {
    id: `u-${Date.now()}`, name, password: body.password || '888888',
    dept: body.dept || '', location: body.location || '', avatar: body.avatar || '',
    plantIds: Array.isArray(body.plantIds) ? body.plantIds : [],
    isAdmin: !!body.isAdmin, isBanned: !!body.isBanned,
    registeredAt: new Date().toISOString().split('T')[0]
  };

  db.users.push(newUser);
  await saveDB(c.env, db);
  return c.json({ success: true, user: newUser, message: `已成功创建成员账号【${name}】` });
});

// ─── 24. Admin: update user ──────────────────────────────
app.put('/api/admin/users/:userId', async (c) => {
  const { userId } = c.req.param();
  const body = await c.req.json();
  const db = await loadDB(c.env);
  const index = db.users.findIndex(u => u.id === userId);
  if (index === -1) return c.json({ success: false, message: '成员不存在' }, 404);
  db.users[index] = { ...db.users[index], ...body };
  await saveDB(c.env, db);
  return c.json({ success: true, user: db.users[index], message: `已成功修改成员【${db.users[index].name}】的全字段数据` });
});

// ─── 25. Admin: create care log ──────────────────────────
app.post('/api/admin/logs', async (c) => {
  const body = await c.req.json();
  const db = await loadDB(c.env);
  const actionType = body.actionType || '浇水';
  const iconMap: Record<string, string> = {
    '浇水': '💧', '施肥': '✨', '叶面肥': '🌱', '松土': '🪴', '定植': '🌿',
    '打药': '🛡️', '打顶剪枝': '✂️', '位置变更': '📍', '成长拍照': '📷',
    '晒太阳': '☀️', '所有权转移': '🤝'
  };

  const newLog: CareLog = {
    id: `log-${Date.now()}`,
    plantIds: Array.isArray(body.plantIds) ? body.plantIds : [1],
    userId: body.userId || 'u-admin', userName: body.userName || '管理员',
    userDept: body.userDept || '管理部', userLocation: body.userLocation || '办公区',
    userAvatar: body.userAvatar || '', actionType,
    actionIcon: iconMap[actionType] || '📝',
    fertilizerName: body.fertilizerName, fertilizerConcentration: body.fertilizerConcentration,
    locationNew: body.locationNew, waterVolume: body.waterVolume, photo: body.photo,
    notes: body.notes,
    helpedColleagues: Array.isArray(body.helpedColleagues) ? body.helpedColleagues : [],
    createdAt: body.createdAt || new Date().toLocaleString('zh-CN'),
    likes: [], comments: []
  };

  db.logs.unshift(newLog);
  await saveDB(c.env, db);
  return c.json({ success: true, log: newLog, message: '已成功手动添加养护日志' });
});

// ─── 26. Admin: update care log ──────────────────────────
app.put('/api/admin/logs/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const db = await loadDB(c.env);
  const index = db.logs.findIndex(l => l.id === id);
  if (index === -1) return c.json({ success: false, message: '日志不存在' }, 404);
  db.logs[index] = { ...db.logs[index], ...body };
  await saveDB(c.env, db);
  return c.json({ success: true, log: db.logs[index], message: '已成功更新该条日志的全字段数据' });
});

// ─── 27. Admin: delete care log ──────────────────────────
app.delete('/api/admin/logs/:id', async (c) => {
  const { id } = c.req.param();
  const db = await loadDB(c.env);
  const index = db.logs.findIndex(l => l.id === id);
  if (index === -1) return c.json({ success: false, message: '日志不存在' }, 404);
  db.logs.splice(index, 1);
  await saveDB(c.env, db);
  return c.json({ success: true, message: '已成功删除该条养护日志' });
});

// ─── 28. GET /api/system/config ──────────────────────────
app.get('/api/system/config', async (c) => {
  const db = await loadDB(c.env);
  return c.json({ success: true, config: db.systemConfig || DEFAULT_SYSTEM_CONFIG });
});

// ─── 29. PUT /api/system/config ──────────────────────────
app.put('/api/system/config', async (c) => {
  const body = await c.req.json();
  const db = await loadDB(c.env);
  db.systemConfig = body;
  await saveDB(c.env, db);
  return c.json({ success: true, config: db.systemConfig, message: '全局系统字典配置保存成功！' });
});

// ─── 30. POST /api/system/action-types ───────────────────
app.post('/api/system/action-types', async (c) => {
  const body = await c.req.json();
  const db = await loadDB(c.env);
  if (!db.systemConfig) db.systemConfig = DEFAULT_SYSTEM_CONFIG;

  const newAction: SystemActionTypeConfig = {
    id: body.id || `act-${Date.now()}`,
    key: body.label || body.key || '新操作',
    label: body.label || body.key || '新操作',
    icon: body.icon || '📝',
    colorBg: body.colorBg || 'bg-emerald-100',
    colorText: body.colorText || 'text-emerald-800',
    description: body.description || '',
    enableWaterInput: !!body.enableWaterInput,
    enableFertilizerInput: !!body.enableFertilizerInput,
    enableLocationInput: !!body.enableLocationInput
  };

  const existingIdx = db.systemConfig.actionTypes.findIndex(a => a.id === newAction.id || a.label === newAction.label);
  if (existingIdx !== -1) { db.systemConfig.actionTypes[existingIdx] = newAction; }
  else { db.systemConfig.actionTypes.push(newAction); }

  await saveDB(c.env, db);
  return c.json({ success: true, config: db.systemConfig, actionType: newAction, message: `已成功保存操作动作【${newAction.label}】` });
});

// ─── 31. DELETE /api/system/action-types/:id ─────────────
app.delete('/api/system/action-types/:id', async (c) => {
  const { id } = c.req.param();
  const db = await loadDB(c.env);
  if (!db.systemConfig) db.systemConfig = DEFAULT_SYSTEM_CONFIG;
  db.systemConfig.actionTypes = db.systemConfig.actionTypes.filter(a => a.id !== id && a.label !== id && a.key !== id);
  await saveDB(c.env, db);
  return c.json({ success: true, config: db.systemConfig, message: '已删除该操作动作类型' });
});

// ─── 32. GET /api/stats ──────────────────────────────────
app.get('/api/stats', async (c) => {
  const db = await loadDB(c.env);

  const gardenerStats: Record<string, { name: string; dept: string; count: number; helpedCount: number; photosCount: number }> = {};
  db.logs.forEach(log => {
    if (!gardenerStats[log.userName]) {
      gardenerStats[log.userName] = { name: log.userName, dept: log.userLocation || '养护区域', count: 0, helpedCount: 0, photosCount: 0 };
    }
    gardenerStats[log.userName].count += 1;
    if (log.helpedColleagues && log.helpedColleagues.length > 0) gardenerStats[log.userName].helpedCount += log.helpedColleagues.length;
    if (log.photo) gardenerStats[log.userName].photosCount += 1;
  });

  const topGardeners = Object.values(gardenerStats).sort((a, b) => b.count - a.count);
  const topHelpers = Object.values(gardenerStats).sort((a, b) => b.helpedCount - a.helpedCount);
  const topPhotographers = Object.values(gardenerStats).sort((a, b) => b.photosCount - a.photosCount);

  const usersList = db.users.map(u => {
    const careCount = db.logs.filter(l => l.userName === u.name || l.userId === u.id).length;
    let helpedCount = 0;
    db.logs.forEach(l => {
      if ((l.userName === u.name || l.userId === u.id) && l.helpedColleagues) helpedCount += l.helpedColleagues.length;
    });
    return {
      id: u.id, name: u.name, avatar: u.avatar || '',
      location: u.location || '养护区域', isAdmin: !!u.isAdmin,
      careCount, helpedCount, registeredAt: u.registeredAt || '2026-08-01'
    };
  });
  usersList.sort((a, b) => b.careCount - a.careCount);

  return c.json({
    success: true,
    totalLogs: db.logs.length,
    totalCareLogs: db.logs.length,
    totalUsers: db.users.length,
    users: usersList,
    thrivingPlants: db.plants.filter(p => p.health === '茁壮成长').length,
    thirstyPlants: db.plants.filter(p => p.health === '需要浇水').length,
    topGardeners: topGardeners.slice(0, 5),
    topHelpers: topHelpers.slice(0, 5),
    topPhotographers: topPhotographers.slice(0, 5)
  });
});

// ─── 33. POST /api/ai/diagnose (fallback) ────────────────
app.post('/api/ai/diagnose', async (c) => {
  const { question, plantName, healthStatus } = await c.req.json();
  const answer = `【农小蛙植物AI助手智能提示】: 收到关于《${plantName || '辣椒苗'}》（状态：${healthStatus || '正常'}）的询问："${question}"。建议保持每日适度散光照射，避免积水，保持通风良好；如遇虫害可适当擦拭或使用无毒有机除虫液。`;
  return c.json({ success: true, answer });
});

// ─── Static Asset Fallback (SPA) ─────────────────────────
app.all('*', async (c) => {
  // Try to serve the static asset first
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  // If found (200), return it directly
  if (assetRes.status !== 404) {
    return assetRes;
  }
  // SPA fallback: serve index.html for client-side routing
  const indexUrl = new URL('/', c.req.url);
  const indexRes = await c.env.ASSETS.fetch(new Request(indexUrl, c.req.raw));
  return new Response(indexRes.body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

export default app;
