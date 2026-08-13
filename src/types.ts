export type ActionType = string;

export interface SystemActionTypeConfig {
  id: string;
  key: string;            // Action identifier, e.g. '浇水', '施肥', '虫害防治'
  label: string;          // Action label shown to user, e.g. '浇水', '施肥', '虫害防治'
  icon: string;           // Emoji or icon symbol, e.g. '💧', '✨', '🐛'
  colorBg?: string;       // e.g. 'bg-rose-100'
  colorText?: string;     // e.g. 'text-rose-800'
  description?: string;   // e.g. '病虫害识别与防护处理'
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

export interface Plant {
  id: number;
  code: string;
  name: string;
  claimed: boolean;
  ownerName?: string;
  owners: string[];
  primaryDept: string;
  location: string;
  status: string; // Dynamic growth stage e.g. '芽苗期' | '定植期' | '生长期' ...
  health: string; // Dynamic health status e.g. '茁壮成长' | '需要浇水' | '观察中' ...
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

export interface CareLog {
  id: string;
  plantIds: number[];
  userId: string;
  userName: string;
  userDept?: string;
  userLocation?: string;
  userAvatar?: string;
  actionType: ActionType;
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
  isDeleted?: boolean;
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

export interface StatsData {
  totalCareLogs: number;
  totalLogs?: number;
  totalUsers?: number;
  thrivingPlants: number;
  thirstyPlants: number;
  users?: any[];
  topGardeners: { name: string; dept: string; count: number; helpedCount: number; photosCount: number }[];
  topHelpers: { name: string; dept: string; count: number; helpedCount: number; photosCount: number }[];
  topPhotographers: { name: string; dept: string; count: number; helpedCount: number; photosCount: number }[];
}

export const PRESET_LOCATIONS = ['技术部办公区', '财务办公区', '大厅展现区', '直播间', '自媒体办公区', '人事办公室', '前台与休息区'];

export const DEPARTMENTS = PRESET_LOCATIONS;

export const COMMON_FERTILIZERS = ['磷酸二氢钾', '通用型复合肥', '水溶育苗肥', '羊粪有机肥', '奥绿缓释肥', '自制发酵液', '硝酸钾叶面肥'];

export const FERTILIZER_CONCENTRATIONS = ['1:1000 稀释液', '1:2000 灌根液', '1:500 喷叶', '薄肥勤施微量', '原液稀释 500ppm'];
