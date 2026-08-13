import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for external frontends (e.g. Cloudflare Pages)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// File-based Database Path
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'pepper_db.json');

// Interface Definitions
export interface Plant {
  id: number; // 1 - 15
  code: string; // e.g. "辣椒 #01"
  name: string; // e.g. "辣椒 #01"
  claimed: boolean;
  ownerName?: string;
  owners: string[]; // Primary owners e.g. ["张伟"]
  primaryDept: string; // e.g. "技术部办公区"
  location: string; // e.g. "技术部办公区"
  status: string; // Growth stage e.g. '芽苗期' | '定植期' | '生长期' | '开花期' | '挂果期' | '采收期'
  health: '茁壮成长' | '需要浇水' | '需要施肥' | '观察中' | '病虫害防护';
  plantedDate: string;
  avatar: string; // Current photo URL / Base64
  initialAvatar: string; // Initial planting photo
  careCount: number;
  lastWateredAt?: string;
  lastFertilizedAt?: string;
  lastCareAt?: string;
  notes?: string;
  isDeleted?: boolean;
}

export interface CareLog {
  id: string;
  plantIds: number[]; // Main plant and co-cared plants
  userId: string;
  userName: string;
  userDept?: string;
  userLocation?: string;
  userAvatar?: string;
  actionType: '浇水' | '施肥' | '叶面肥' | '松土' | '定植' | '打药' | '打顶剪枝' | '位置变更' | '成长拍照' | '晒太阳' | '所有权转移';
  actionIcon: string;
  
  // Specific action details
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

export interface UserProfile {
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

export interface SystemActionTypeConfig {
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

export interface SystemConfig {
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

const INITIAL_PLANTS: Plant[] = [
  {
    id: 1,
    code: '辣椒 #01',
    name: '辣椒 #01',
    claimed: true,
    ownerName: '张伟',
    owners: ['张伟'],
    primaryDept: '技术部办公区',
    location: '技术部办公区',
    status: '生长期',
    health: '茁壮成长',
    plantedDate: '2026-08-01',
    avatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
    careCount: 12,
    lastWateredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastCareAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: '一号朝天椒长势迅猛，顶端已经冒出第二对真叶！'
  },
  {
    id: 2,
    code: '辣椒 #02',
    name: '辣椒 #02',
    claimed: true,
    ownerName: '李娜',
    owners: ['李娜'],
    primaryDept: '财务办公区',
    location: '财务办公区',
    status: '定植期',
    health: '需要浇水',
    plantedDate: '2026-08-01',
    avatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
    careCount: 8,
    lastWateredAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    lastCareAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    notes: '放在财务窗口，晒太阳充足。'
  },
  {
    id: 3,
    code: '辣椒 #03',
    name: '辣椒 #03',
    claimed: true,
    ownerName: '王强',
    owners: ['王强'],
    primaryDept: '直播间',
    location: '直播间',
    status: '生长期',
    health: '茁壮成长',
    plantedDate: '2026-08-01',
    avatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    careCount: 15,
    lastWateredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastCareAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: '直播间环境适宜，生长期形态端正。'
  },
  {
    id: 4,
    code: '辣椒 #04',
    name: '辣椒 #04',
    claimed: false,
    owners: [],
    primaryDept: '人事办公室',
    location: '人事办公室',
    status: '芽苗期',
    health: '茁壮成长',
    plantedDate: '2026-08-01',
    avatar: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80',
    careCount: 3,
    lastCareAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    notes: '人事办前台待认领。'
  },
  {
    id: 5,
    code: '辣椒 #05',
    name: '辣椒 #05',
    claimed: false,
    owners: [],
    primaryDept: '大厅展现区',
    location: '大厅展现区',
    status: '芽苗期',
    health: '需要施肥',
    plantedDate: '2026-08-02',
    avatar: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    careCount: 5,
    lastCareAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    notes: '大厅采光区待领用。'
  },
  {
    id: 6, code: '辣椒 #06', name: '辣椒 #06', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-02',
    avatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80', careCount: 2
  },
  {
    id: 7, code: '辣椒 #07', name: '辣椒 #07', claimed: false, owners: [], primaryDept: '自媒体办公区', location: '自媒体办公区',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-02',
    avatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80', careCount: 4
  },
  {
    id: 8, code: '辣椒 #08', name: '辣椒 #08', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区',
    status: '芽苗期', health: '观察中', plantedDate: '2026-08-02',
    avatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80', careCount: 1
  },
  {
    id: 9, code: '辣椒 #09', name: '辣椒 #09', claimed: false, owners: [], primaryDept: '财务办公区', location: '财务办公区',
    status: '芽苗期', health: '需要浇水', plantedDate: '2026-08-03',
    avatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80', careCount: 1
  },
  {
    id: 10, code: '辣椒 #10', name: '辣椒 #10', claimed: false, owners: [], primaryDept: '大厅展现区', location: '大厅展现区',
    status: '定植期', health: '茁壮成长', plantedDate: '2026-08-03',
    avatar: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80', careCount: 3
  },
  {
    id: 11, code: '辣椒 #11', name: '辣椒 #11', claimed: false, owners: [], primaryDept: '人事办公室', location: '人事办公室',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-03',
    avatar: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80', careCount: 2
  },
  {
    id: 12, code: '辣椒 #12', name: '辣椒 #12', claimed: false, owners: [], primaryDept: '自媒体办公区', location: '自媒体办公区',
    status: '芽苗期', health: '需要施肥', plantedDate: '2026-08-04',
    avatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80', careCount: 2
  },
  {
    id: 13, code: '辣椒 #13', name: '辣椒 #13', claimed: false, owners: [], primaryDept: '技术部办公区', location: '技术部办公区',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-04',
    avatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80', careCount: 1
  },
  {
    id: 14, code: '辣椒 #14', name: '辣椒 #14', claimed: false, owners: [], primaryDept: '财务办公区', location: '财务办公区',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-04',
    avatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80', careCount: 2
  },
  {
    id: 15, code: '辣椒 #15', name: '辣椒 #15', claimed: false, owners: [], primaryDept: '大厅展现区', location: '大厅展现区',
    status: '芽苗期', health: '茁壮成长', plantedDate: '2026-08-05',
    avatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    initialAvatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80', careCount: 3
  }
];

const INITIAL_LOGS: CareLog[] = [
  {
    id: 'log-101',
    plantIds: [1],
    userId: 'u-1',
    userName: '张伟',
    userDept: '技术部办公区',
    actionType: '浇水',
    actionIcon: '💧',
    waterVolume: '250ml 晾晒透水',
    notes: '早上巡视给1号辣苗补足了水分，土壤透气性良好。',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    likes: [{ userName: '李娜', createdAt: new Date().toISOString() }, { userName: '王强', createdAt: new Date().toISOString() }],
    comments: [
      { id: 'c-1', userName: '李娜', text: '张工太勤快了！', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'log-102',
    plantIds: [3, 2],
    userId: 'u-3',
    userName: '王强',
    userDept: '直播间',
    actionType: '施肥',
    actionIcon: '🧪',
    fertilizerName: '磷酸二氢钾',
    fertilizerConcentration: '1:1000 稀释液',
    helpedColleagues: ['李娜'],
    notes: '给自己的辣苗 #03 施了薄肥，顺便给隔壁李娜的2号辣苗也淋了一点！',
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    likes: [{ userName: '李娜', createdAt: new Date().toISOString() }, { userName: '张伟', createdAt: new Date().toISOString() }],
    comments: [
      { id: 'c-2', userName: '李娜', text: '谢谢强哥照顾！给你点赞👍', createdAt: new Date().toISOString() }
    ]
  }
];

// Read DB Helper
function loadDB(): DBData {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBData = {
        plants: INITIAL_PLANTS,
        logs: INITIAL_LOGS,
        users: [
          { id: 'u-1', name: '张伟', password: '123', location: '技术部办公区', plantIds: [1], registeredAt: '2026-08-01' },
          { id: 'u-2', name: '李娜', password: '123', location: '财务办公区', plantIds: [2], registeredAt: '2026-08-01' },
          { id: 'u-3', name: '王强', password: '123', location: '直播间', plantIds: [3], registeredAt: '2026-08-01' }
        ],
        systemConfig: DEFAULT_SYSTEM_CONFIG
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data: DBData = JSON.parse(raw);
    if (!data.systemConfig || !Array.isArray(data.systemConfig.actionTypes) || data.systemConfig.actionTypes.length < 14) {
      const existingLabels = new Set((data.systemConfig?.actionTypes || []).map(a => a.label || a.key));
      const missingStandard = DEFAULT_SYSTEM_CONFIG.actionTypes.filter(def => !existingLabels.has(def.label) && !existingLabels.has(def.key));
      data.systemConfig = {
        ...DEFAULT_SYSTEM_CONFIG,
        ...data.systemConfig,
        actionTypes: [
          ...(data.systemConfig?.actionTypes || []),
          ...missingStandard
        ]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
  } catch (err) {
    console.error('Error reading database file:', err);
    return { plants: INITIAL_PLANTS, logs: INITIAL_LOGS, users: [], systemConfig: DEFAULT_SYSTEM_CONFIG };
  }
}

// Save DB Helper
function saveDB(data: DBData) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// API Routes

// 1. Get All Active Plants (filter out deleted ones)
app.get('/api/plants', (req, res) => {
  const db = loadDB();
  const activePlants = db.plants.filter(p => !p.isDeleted).map(p => {
    const plantLogs = db.logs ? db.logs.filter(l => l.plantIds && Array.isArray(l.plantIds) && l.plantIds.includes(p.id)) : [];
    const logCount = plantLogs.length;
    
    // Auto-link to the absolute latest photo uploaded for this plant
    let latestPhoto = p.avatar;
    if (plantLogs.length > 0) {
      const logsWithPhoto = plantLogs.filter(l => l.photo && l.photo.trim() !== '');
      if (logsWithPhoto.length > 0) {
        logsWithPhoto.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (logsWithPhoto[0].photo) {
          latestPhoto = logsWithPhoto[0].photo;
        }
      }
    }

    return {
      ...p,
      avatar: latestPhoto,
      careCount: Math.max(p.careCount || 0, logCount)
    };
  });
  res.json({ success: true, plants: activePlants });
});

// 2. Update a Plant (Stage / Status / Health / Location / Notes / Avatar)
app.put('/api/plants/:id', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const index = db.plants.findIndex(p => p.id === plantId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: '找不到对应的植株' });
  }

  const updatedPlant = { ...db.plants[index], ...req.body };
  db.plants[index] = updatedPlant;
  saveDB(db);
  res.json({ success: true, plant: updatedPlant });
});

// 3. Claim a Plant (15个码只能被领用一次)
app.post('/api/plants/:id/claim', (req, res) => {
  const plantId = parseInt(req.params.id);
  const { userId, userName, location } = req.body;
  if (!userName) return res.status(400).json({ success: false, message: '请提供领用人姓名' });

  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) {
    return res.status(404).json({ success: false, message: '找不到此盆植株' });
  }

  // Check if already claimed
  if (plant.claimed || (plant.ownerName && plant.ownerName.trim() !== '')) {
    return res.status(400).json({
      success: false,
      message: `该植株编号与二维码【${plant.code}】已被【${plant.ownerName || '他人'}】成功认领绑定！每一个二维码与编号只能被认领一次，无法重复认领绑定！`
    });
  }

  plant.claimed = true;
  plant.ownerName = userName;
  plant.owners = [userName];
  if (location) plant.location = location;

  // Sync to user record
  let user = db.users.find(u => u.name === userName);
  if (user) {
    if (!user.plantIds) user.plantIds = [];
    if (!user.plantIds.includes(plantId)) user.plantIds.push(plantId);
  } else {
    user = {
      id: userId || 'u-' + Date.now(),
      name: userName,
      password: '123',
      location: location || '养护区域',
      plantIds: [plantId],
      registeredAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(user);
  }

  saveDB(db);
  res.json({ success: true, plant, user });
});

// 4. Transfer Plant Ownership
app.post('/api/plants/transfer', (req, res) => {
  const { plantId, fromUserName, toUserName, reason } = req.body;
  if (!plantId || !fromUserName || !toUserName) {
    return res.status(400).json({ success: false, message: '转让参数不完整' });
  }

  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return res.status(404).json({ success: false, message: '盆栽未找到' });

  plant.claimed = true;
  plant.ownerName = toUserName;
  plant.owners = [toUserName];

  // Update recipient user profile
  let toUser = db.users.find(u => u.name === toUserName);
  if (toUser) {
    if (!toUser.plantIds) toUser.plantIds = [];
    if (!toUser.plantIds.includes(plantId)) toUser.plantIds.push(plantId);
  } else {
    db.users.push({
      id: 'u-' + Date.now(),
      name: toUserName,
      password: '123',
      location: plant.location || '养护区域',
      plantIds: [plantId],
      registeredAt: new Date().toISOString().split('T')[0]
    });
  }

  // Create CareLog of type '所有权转移'
  const nowIso = new Date().toISOString();
  const transferLog: CareLog = {
    id: 'log-' + Date.now(),
    plantIds: [plantId],
    userId: 'system',
    userName: fromUserName,
    actionType: '所有权转移',
    actionIcon: '🎁',
    notes: `【所有权转移】${fromUserName} 已将 ${plant.code} 的所有权登记转让给【${toUserName}】。原因：${reason || '交接照顾'}`,
    createdAt: nowIso,
    likes: [],
    comments: []
  };

  db.logs.unshift(transferLog);
  saveDB(db);

  res.json({ success: true, plant, log: transferLog });
});

// 5. Get Care Logs
app.get('/api/logs', (req, res) => {
  const { plantId, actionType, search } = req.query;
  const db = loadDB();
  let filtered = [...db.logs];

  if (plantId) {
    const pid = parseInt(plantId as string);
    filtered = filtered.filter(l => l.plantIds.includes(pid));
  }

  if (actionType && actionType !== '全部') {
    filtered = filtered.filter(l => l.actionType === actionType);
  }

  if (search) {
    const term = (search as string).toLowerCase();
    filtered = filtered.filter(l => 
      l.userName.toLowerCase().includes(term) ||
      l.notes?.toLowerCase().includes(term)
    );
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, logs: filtered });
});

// 6. Post New Care Log
app.post('/api/logs', (req, res) => {
  const {
    plantIds,
    userId,
    userName,
    userLocation,
    userAvatar,
    actionType,
    fertilizerName,
    fertilizerConcentration,
    locationNew,
    waterVolume,
    photo,
    notes,
    helpedColleagues
  } = req.body;

  if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0 || !userName) {
    return res.status(400).json({ success: false, message: '请填写打卡必要参数' });
  }

  const db = loadDB();

  // 校验打卡者权限：非管理员账号必须属于该植株的认领人或共同养护人
  const isServerAdmin = userName.trim().toLowerCase() === 'admin';
  if (!isServerAdmin) {
    const userOwnedPlantIds = db.plants
      .filter(p => p.ownerName === userName || (Array.isArray(p.owners) && p.owners.includes(userName)))
      .map(p => p.id);

    const mainPlantId = Number(plantIds[0]);
    if (!userOwnedPlantIds.includes(mainPlantId)) {
      return res.status(403).json({
        success: false,
        message: `无护理打卡权限：您尚未绑定认领 ${mainPlantId}# 植株，无法直接提交日志！请先前往认领该植株。`
      });
    }
  }
  const actionIcons: Record<string, string> = {
    '浇水': '💧',
    '施肥': '🧪',
    '叶面肥': '🍃',
    '松土': '🌱',
    '定植': '🪴',
    '打药': '🐛',
    '打顶剪枝': '✂️',
    '位置变更': '📍',
    '成长拍照': '📸',
    '晒太阳': '☀️',
    '所有权转移': '🎁'
  };

  const nowIso = new Date().toISOString();
  const newLog: CareLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    plantIds,
    userId: userId || 'user-' + Date.now(),
    userName,
    userDept: userLocation || '养护区域',
    userLocation: userLocation || '养护区域',
    userAvatar,
    actionType,
    actionIcon: actionIcons[actionType] || '📝',
    fertilizerName,
    fertilizerConcentration,
    locationNew,
    waterVolume,
    photo,
    notes,
    helpedColleagues: helpedColleagues || [],
    createdAt: nowIso,
    likes: [],
    comments: []
  };

  db.logs.unshift(newLog);

  // Update associated plants
  plantIds.forEach((pid: number) => {
    const plant = db.plants.find(p => p.id === pid);
    if (plant) {
      plant.careCount = (plant.careCount || 0) + 1;
      plant.lastCareAt = nowIso;
      
      if (actionType === '浇水') {
        plant.lastWateredAt = nowIso;
        if (plant.health === '需要浇水') plant.health = '茁壮成长';
      } else if (actionType === '施肥' || actionType === '叶面肥') {
        plant.lastFertilizedAt = nowIso;
        if (plant.health === '需要施肥') plant.health = '茁壮成长';
      } else if (actionType === '位置变更' && locationNew) {
        plant.location = locationNew;
      }

      if (photo && photo.trim() !== '') {
        plant.avatar = photo;
      }
    }
  });

  saveDB(db);
  res.json({ success: true, log: newLog });
});

// 7. Like Log
app.post('/api/logs/:id/like', (req, res) => {
  const logId = req.params.id;
  const { userName } = req.body;
  if (!userName) return res.status(400).json({ success: false, message: '需要姓名' });

  const db = loadDB();
  const log = db.logs.find(l => l.id === logId);
  if (!log) return res.status(404).json({ success: false, message: '动态不存在' });

  const existingIndex = log.likes.findIndex(lk => lk.userName === userName);
  if (existingIndex >= 0) {
    log.likes.splice(existingIndex, 1);
  } else {
    log.likes.push({ userName, createdAt: new Date().toISOString() });
  }

  saveDB(db);
  res.json({ success: true, likes: log.likes });
});

// 8. Comment Log
app.post('/api/logs/:id/comments', (req, res) => {
  const logId = req.params.id;
  const { userName, text } = req.body;
  if (!userName || !text) return res.status(400).json({ success: false, message: '请填写评论内容' });

  const db = loadDB();
  const log = db.logs.find(l => l.id === logId);
  if (!log) return res.status(404).json({ success: false, message: '动态不存在' });

  const comment = {
    id: 'c-' + Date.now(),
    userName,
    text,
    createdAt: new Date().toISOString()
  };

  log.comments.push(comment);
  saveDB(db);
  res.json({ success: true, comment });
});

// 9. Auth (User Login & Admin Login)
app.post('/api/auth', (req, res) => {
  const { name, password, location, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '请输入姓名' });
  }

  const trimmedName = name.trim();
  const pwd = password ? password.trim() : '123';

  // Check Admin Login (账号: admin, 密码: 123 或 admin123 或任意密码)
  if (trimmedName.toLowerCase() === 'admin') {
    const adminUser = {
      id: 'admin-001',
      name: 'admin',
      password: pwd || '123',
      isAdmin: true,
      location: '管理员控制中心',
      registeredAt: '2026-08-01'
    };

    const db = loadDB();
    let existingAdmin = db.users.find(u => u.name.toLowerCase() === 'admin');
    if (existingAdmin) {
      existingAdmin.isAdmin = true;
      existingAdmin.password = pwd || '123';
      saveDB(db);
    } else {
      db.users.push(adminUser);
      saveDB(db);
    }

    return res.json({
      success: true,
      user: adminUser
    });
  }

  const db = loadDB();
  let user = db.users.find(u => u.name === trimmedName);

  if (user) {
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: '该账号已被管理员封禁，无法登录！如需解封请联系管理员。' });
    }
    // Verify password if user exists
    if (user.password && user.password !== pwd) {
      return res.status(401).json({ success: false, message: '密码错误！请输入正确的个人密码。' });
    }
    user.password = pwd;
    if (location) user.location = location;
    if (avatar) user.avatar = avatar;
  } else {
    // New user
    user = {
      id: 'u-' + Date.now(),
      name: trimmedName,
      password: pwd,
      location: location || '养护区域',
      avatar,
      plantIds: [],
      isAdmin: false,
      isBanned: false,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(user);
  }

  saveDB(db);
  res.json({ success: true, user });
});

// 10. Admin Accounts Management & Ban/Unban
app.get('/api/users', (req, res) => {
  const db = loadDB();
  res.json({ success: true, users: db.users });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === '123' || password === 'admin123') {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: '管理员密码错误！' });
  }
});

app.post('/api/admin/users/:userId/reset-password', (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: '成员不存在' });

  user.password = newPassword || '888888';
  saveDB(db);
  res.json({ success: true, message: `已成功重置成员【${user.name}】的密码为：${user.password}` });
});

app.post('/api/admin/users/:userId/ban', (req, res) => {
  const { userId } = req.params;
  const { isBanned } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: '成员不存在' });
  if (user.isAdmin) return res.status(400).json({ success: false, message: '不能封禁管理员账号' });

  user.isBanned = !!isBanned;
  saveDB(db);
  res.json({ success: true, user, message: isBanned ? `已封禁成员【${user.name}】` : `已解封成员【${user.name}】` });
});

app.delete('/api/admin/users/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();

  const index = db.users.findIndex(u => u.id === userId);
  if (index === -1) return res.status(404).json({ success: false, message: '成员不存在' });

  const targetUser = db.users[index];

  // Unclaim plants owned by this deleted user
  db.plants.forEach(p => {
    if (p.ownerName === targetUser.name || p.owners.includes(targetUser.name)) {
      p.claimed = false;
      p.ownerName = undefined;
      p.owners = [];
    }
  });

  db.users.splice(index, 1);
  saveDB(db);
  res.json({ success: true, message: `已成功删除成员【${targetUser.name}】` });
});

app.post('/api/admin/plants/:id/unclaim', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return res.status(404).json({ success: false, message: '植株未找到' });

  plant.claimed = false;
  plant.ownerName = undefined;
  plant.owners = [];
  saveDB(db);
  res.json({ success: true, plant });
});

// Admin Batch Create Plants & QR codes
app.post('/api/admin/plants/batch-create', (req, res) => {
  const { count = 1, prefix = '辣椒', location = '技术部办公区', status = '芽苗期', health = '茁壮成长' } = req.body;
  const numCount = Math.min(Math.max(parseInt(count as any) || 1, 1), 50);
  const db = loadDB();

  let maxId = 0;
  db.plants.forEach(p => {
    if (p.id > maxId) maxId = p.id;
  });

  const createdPlants: Plant[] = [];
  const defaultImages = [
    'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80'
  ];

  for (let i = 1; i <= numCount; i++) {
    const newId = maxId + i;
    const padNum = newId < 10 ? `0${newId}` : `${newId}`;
    const code = `${prefix} #${padNum}`;
    const img = defaultImages[(newId - 1) % defaultImages.length];

    const newPlant: Plant = {
      id: newId,
      code,
      name: code,
      claimed: false,
      owners: [],
      primaryDept: location || '技术部办公区',
      location: location || '技术部办公区',
      status: status || '芽苗期',
      health: health || '茁壮成长',
      plantedDate: new Date().toISOString().split('T')[0],
      avatar: img,
      initialAvatar: img,
      careCount: 0
    };

    db.plants.push(newPlant);
    createdPlants.push(newPlant);
  }

  saveDB(db);
  res.json({ success: true, plants: createdPlants, message: `已成功批量增加 ${numCount} 盆辣椒苗！` });
});

// Admin Move Plant to Recycle Bin (Trash)
app.post('/api/admin/plants/:id/recycle', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return res.status(404).json({ success: false, message: '找不到此植物' });

  plant.isDeleted = true;
  saveDB(db);
  res.json({ success: true, message: `已将植物【${plant.code}】移入垃圾桶` });
});

// Admin Restore Plant from Recycle Bin
app.post('/api/admin/plants/:id/restore', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return res.status(404).json({ success: false, message: '找不到此植物' });

  plant.isDeleted = false;
  saveDB(db);
  res.json({ success: true, message: `已将植物【${plant.code}】从垃圾桶恢复！` });
});

// Admin Reset Plant to Initial State
app.post('/api/admin/plants/:id/reset', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const plant = db.plants.find(p => p.id === plantId);
  if (!plant) return res.status(404).json({ success: false, message: '找不到此植物' });

  plant.claimed = false;
  plant.ownerName = undefined;
  plant.owners = [];
  plant.status = '芽苗期';
  plant.health = '茁壮成长';
  plant.careCount = 0;
  plant.lastWateredAt = undefined;
  plant.lastFertilizedAt = undefined;
  plant.lastCareAt = undefined;
  plant.notes = undefined;
  plant.isDeleted = false;
  if (plant.initialAvatar) {
    plant.avatar = plant.initialAvatar;
  }

  saveDB(db);
  res.json({ success: true, plant, message: `已成功将植物【${plant.code}】重置为初始状态！` });
});

// Admin Get Deleted Plants in Recycle Bin
app.get('/api/admin/recycle-bin', (req, res) => {
  const db = loadDB();
  const deletedPlants = db.plants.filter(p => p.isDeleted);
  res.json({ success: true, plants: deletedPlants });
});

// Admin Permanent Delete Plant
app.delete('/api/admin/plants/:id', (req, res) => {
  const plantId = parseInt(req.params.id);
  const db = loadDB();
  const index = db.plants.findIndex(p => p.id === plantId);
  if (index === -1) return res.status(404).json({ success: false, message: '找不到此植物' });

  const targetPlant = db.plants[index];
  db.plants.splice(index, 1);
  saveDB(db);
  res.json({ success: true, message: `已永久删除植物【${targetPlant.code}】` });
});

// Admin Create Single Plant (Full Fields)
app.post('/api/admin/plants', (req, res) => {
  const db = loadDB();
  let maxId = 0;
  db.plants.forEach(p => { if (p.id > maxId) maxId = p.id; });
  const newId = maxId + 1;
  const padNum = newId < 10 ? `0${newId}` : `${newId}`;

  const defaultImg = 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80';

  const newPlant: Plant = {
    id: newId,
    code: req.body.code || `辣椒 #${padNum}`,
    name: req.body.name || `辣椒 #${padNum}`,
    claimed: !!req.body.claimed,
    ownerName: req.body.ownerName || undefined,
    owners: Array.isArray(req.body.owners) ? req.body.owners : (req.body.ownerName ? [req.body.ownerName] : []),
    primaryDept: req.body.primaryDept || '办公区',
    location: req.body.location || '办公区',
    status: req.body.status || '芽苗期',
    health: req.body.health || '茁壮成长',
    plantedDate: req.body.plantedDate || new Date().toISOString().split('T')[0],
    avatar: req.body.avatar || defaultImg,
    initialAvatar: req.body.initialAvatar || req.body.avatar || defaultImg,
    careCount: typeof req.body.careCount === 'number' ? req.body.careCount : 0,
    notes: req.body.notes || undefined,
    isDeleted: false
  };

  db.plants.push(newPlant);
  saveDB(db);
  res.json({ success: true, plant: newPlant, message: `已成功添加植株【${newPlant.code}】` });
});

// Admin Create User (Full Fields)
app.post('/api/admin/users', (req, res) => {
  const db = loadDB();
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ success: false, message: '必须填写成员姓名' });

  if (db.users.some(u => u.name === name)) {
    return res.status(400).json({ success: false, message: `成员【${name}】已存在，请使用其他姓名` });
  }

  const newUser: UserProfile = {
    id: `u-${Date.now()}`,
    name,
    password: req.body.password || '888888',
    dept: req.body.dept || '',
    location: req.body.location || '',
    avatar: req.body.avatar || '',
    plantIds: Array.isArray(req.body.plantIds) ? req.body.plantIds : [],
    isAdmin: !!req.body.isAdmin,
    isBanned: !!req.body.isBanned,
    registeredAt: new Date().toISOString().split('T')[0]
  };

  db.users.push(newUser);
  saveDB(db);
  res.json({ success: true, user: newUser, message: `已成功创建成员账号【${name}】` });
});

// Admin Update User (Full Fields)
app.put('/api/admin/users/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index === -1) return res.status(404).json({ success: false, message: '成员不存在' });

  db.users[index] = { ...db.users[index], ...req.body };
  saveDB(db);
  res.json({ success: true, user: db.users[index], message: `已成功修改成员【${db.users[index].name}】的全字段数据` });
});

// Admin Create Care Log (Full Fields)
app.post('/api/admin/logs', (req, res) => {
  const db = loadDB();
  const actionType = req.body.actionType || '浇水';
  const iconMap: Record<string, string> = {
    '浇水': '💧',
    '施肥': '✨',
    '叶面肥': '🌱',
    '松土': '🪴',
    '定植': '🌿',
    '打药': '🛡️',
    '打顶剪枝': '✂️',
    '位置变更': '📍',
    '成长拍照': '📷',
    '晒太阳': '☀️',
    '所有权转移': '🤝'
  };

  const newLog: CareLog = {
    id: `log-${Date.now()}`,
    plantIds: Array.isArray(req.body.plantIds) ? req.body.plantIds : [1],
    userId: req.body.userId || 'u-admin',
    userName: req.body.userName || '管理员',
    userDept: req.body.userDept || '管理部',
    userLocation: req.body.userLocation || '办公区',
    userAvatar: req.body.userAvatar || '',
    actionType,
    actionIcon: iconMap[actionType] || '📝',
    fertilizerName: req.body.fertilizerName,
    fertilizerConcentration: req.body.fertilizerConcentration,
    locationNew: req.body.locationNew,
    waterVolume: req.body.waterVolume,
    photo: req.body.photo,
    notes: req.body.notes,
    helpedColleagues: Array.isArray(req.body.helpedColleagues) ? req.body.helpedColleagues : [],
    createdAt: req.body.createdAt || new Date().toLocaleString('zh-CN'),
    likes: [],
    comments: []
  };

  db.logs.unshift(newLog);
  saveDB(db);
  res.json({ success: true, log: newLog, message: '已成功手动添加养护日志' });
});

// Admin Update Care Log (Full Fields)
app.put('/api/admin/logs/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const index = db.logs.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: '日志不存在' });

  db.logs[index] = { ...db.logs[index], ...req.body };
  saveDB(db);
  res.json({ success: true, log: db.logs[index], message: '已成功更新该条日志的全字段数据' });
});

// Admin Delete Care Log
app.delete('/api/admin/logs/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const index = db.logs.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: '日志不存在' });

  db.logs.splice(index, 1);
  saveDB(db);
  res.json({ success: true, message: '已成功删除该条养护日志' });
});

// System Config API Endpoints
app.get('/api/system/config', (req, res) => {
  const db = loadDB();
  res.json({ success: true, config: db.systemConfig || DEFAULT_SYSTEM_CONFIG });
});

app.put('/api/system/config', (req, res) => {
  const db = loadDB();
  db.systemConfig = req.body;
  saveDB(db);
  res.json({ success: true, config: db.systemConfig, message: '全局系统字典配置保存成功！' });
});

app.post('/api/system/action-types', (req, res) => {
  const db = loadDB();
  if (!db.systemConfig) db.systemConfig = DEFAULT_SYSTEM_CONFIG;
  
  const newAction: SystemActionTypeConfig = {
    id: req.body.id || `act-${Date.now()}`,
    key: req.body.label || req.body.key || '新操作',
    label: req.body.label || req.body.key || '新操作',
    icon: req.body.icon || '📝',
    colorBg: req.body.colorBg || 'bg-emerald-100',
    colorText: req.body.colorText || 'text-emerald-800',
    description: req.body.description || '',
    enableWaterInput: !!req.body.enableWaterInput,
    enableFertilizerInput: !!req.body.enableFertilizerInput,
    enableLocationInput: !!req.body.enableLocationInput
  };

  const existingIdx = db.systemConfig.actionTypes.findIndex(a => a.id === newAction.id || a.label === newAction.label);
  if (existingIdx !== -1) {
    db.systemConfig.actionTypes[existingIdx] = newAction;
  } else {
    db.systemConfig.actionTypes.push(newAction);
  }

  saveDB(db);
  res.json({ success: true, config: db.systemConfig, actionType: newAction, message: `已成功保存操作动作【${newAction.label}】` });
});

app.delete('/api/system/action-types/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.systemConfig) db.systemConfig = DEFAULT_SYSTEM_CONFIG;

  db.systemConfig.actionTypes = db.systemConfig.actionTypes.filter(a => a.id !== id && a.label !== id && a.key !== id);
  saveDB(db);
  res.json({ success: true, config: db.systemConfig, message: '已删除该操作动作类型' });
});

// 11. Stats Endpoint
app.get('/api/stats', (req, res) => {
  const db = loadDB();
  
  const gardenerStats: Record<string, { name: string; dept: string; count: number; helpedCount: number; photosCount: number }> = {};

  db.logs.forEach(log => {
    if (!gardenerStats[log.userName]) {
      gardenerStats[log.userName] = {
        name: log.userName,
        dept: log.userLocation || '养护区域',
        count: 0,
        helpedCount: 0,
        photosCount: 0
      };
    }
    gardenerStats[log.userName].count += 1;
    if (log.helpedColleagues && log.helpedColleagues.length > 0) {
      gardenerStats[log.userName].helpedCount += log.helpedColleagues.length;
    }
    if (log.photo) {
      gardenerStats[log.userName].photosCount += 1;
    }
  });

  const topGardeners = Object.values(gardenerStats).sort((a, b) => b.count - a.count);
  const topHelpers = Object.values(gardenerStats).sort((a, b) => b.helpedCount - a.helpedCount);
  const topPhotographers = Object.values(gardenerStats).sort((a, b) => b.photosCount - a.photosCount);

  const totalCareLogs = db.logs.length;
  const totalLogs = db.logs.length;
  const totalUsers = db.users.length;
  const thirstyPlants = db.plants.filter(p => p.health === '需要浇水').length;
  const thrivingPlants = db.plants.filter(p => p.health === '茁壮成长').length;

  // Build complete user statistics list for Leaderboard
  const usersList = db.users.map(u => {
    const careCount = db.logs.filter(l => l.userName === u.name || l.userId === u.id).length;
    let helpedCount = 0;
    db.logs.forEach(l => {
      if ((l.userName === u.name || l.userId === u.id) && l.helpedColleagues) {
        helpedCount += l.helpedColleagues.length;
      }
    });

    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar || '',
      location: u.location || '养护区域',
      isAdmin: !!u.isAdmin,
      careCount,
      helpedCount,
      registeredAt: u.registeredAt || '2026-08-01'
    };
  });

  // Sort users by care count descending
  usersList.sort((a, b) => b.careCount - a.careCount);

  res.json({
    success: true,
    totalLogs,
    totalCareLogs,
    totalUsers,
    users: usersList,
    thrivingPlants,
    thirstyPlants,
    topGardeners: topGardeners.slice(0, 5),
    topHelpers: topHelpers.slice(0, 5),
    topPhotographers: topPhotographers.slice(0, 5)
  });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌶️ 辣椒记录服务器已开启: http://0.0.0.0:${PORT}`);
  });
}

startServer();
