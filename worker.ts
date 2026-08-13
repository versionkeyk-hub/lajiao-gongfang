var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}
__name(json, "json");
function errorJson(message, status = 400) {
  return json({ success: false, message }, status);
}
__name(errorJson, "errorJson");
function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
__name(safeJsonParse, "safeJsonParse");
function parsePlant(row) {
  return {
    id: Number(row.id),
    code: String(row.code || ""),
    name: String(row.name || ""),
    claimed: Boolean(row.claimed),
    ownerName: row.owner_name ? String(row.owner_name) : void 0,
    owners: safeJsonParse(String(row.owners || "[]"), []),
    primaryDept: String(row.primary_dept || ""),
    location: String(row.location || ""),
    status: String(row.status || ""),
    health: String(row.health || ""),
    plantedDate: String(row.planted_date || ""),
    avatar: String(row.avatar || ""),
    initialAvatar: String(row.initial_avatar || ""),
    careCount: Number(row.care_count || 0),
    lastWateredAt: row.last_watered_at ? String(row.last_watered_at) : void 0,
    lastFertilizedAt: row.last_fertilized_at ? String(row.last_fertilized_at) : void 0,
    lastCareAt: row.last_care_at ? String(row.last_care_at) : void 0,
    notes: row.notes ? String(row.notes) : void 0,
    isDeleted: Boolean(row.is_deleted)
  };
}
__name(parsePlant, "parsePlant");
function parseLog(row) {
  return {
    id: String(row.id || ""),
    plantIds: safeJsonParse(String(row.plant_ids || "[]"), []),
    userId: String(row.user_id || ""),
    userName: String(row.user_name || ""),
    userDept: row.user_dept ? String(row.user_dept) : void 0,
    userLocation: row.user_location ? String(row.user_location) : void 0,
    userAvatar: row.user_avatar ? String(row.user_avatar) : void 0,
    actionType: String(row.action_type || ""),
    actionIcon: String(row.action_icon || ""),
    fertilizerName: row.fertilizer_name ? String(row.fertilizer_name) : void 0,
    fertilizerConcentration: row.fertilizer_concentration ? String(row.fertilizer_concentration) : void 0,
    locationNew: row.location_new ? String(row.location_new) : void 0,
    waterVolume: row.water_volume ? String(row.water_volume) : void 0,
    photo: row.photo ? String(row.photo) : void 0,
    notes: row.notes ? String(row.notes) : void 0,
    helpedColleagues: safeJsonParse(String(row.helped_colleagues || "[]"), []),
    createdAt: String(row.created_at || ""),
    likes: safeJsonParse(String(row.likes || "[]"), []),
    comments: safeJsonParse(String(row.comments || "[]"), [])
  };
}
__name(parseLog, "parseLog");
function parseUser(row) {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    password: row.password ? String(row.password) : void 0,
    dept: row.dept ? String(row.dept) : void 0,
    location: String(row.location || ""),
    avatar: row.avatar ? String(row.avatar) : void 0,
    plantIds: safeJsonParse(String(row.plant_ids || "[]"), []),
    isAdmin: Boolean(row.is_admin),
    isBanned: Boolean(row.is_banned),
    registeredAt: String(row.registered_at || "")
  };
}
__name(parseUser, "parseUser");
var ACTION_ICONS = {
  "\u6D47\u6C34": "\u{1F4A7}",
  "\u65BD\u80A5": "\u{1F331}",
  "\u53F6\u9762\u80A5": "\u{1F321}",
  "\u677E\u571F\u57F9\u571F": "\u{1F335}",
  "\u6253\u836F\u9632\u866B": "\u{1F430}",
  "\u6253\u9876\u526A\u679D": "\u2702\uFE0F",
  "\u4F4D\u7F6E\u53D8\u66F4": "\u{1F4CD}",
  "\u6210\u957F\u62CD\u7167": "\u{1F4F7}",
  "\u6652\u592A\u9633": "\u2600\uFE0F",
  "\u6240\u6709\u6743\u8F6C\u79FB": "\u{1F504}"
};
function generateToken(userId) {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + 864e5 * 7 });
  return btoa(payload);
}
__name(generateToken, "generateToken");
// v13 标准配置：14 个动作类型 + 线上原有的「所有权转移」= 15 个（只增不减）
function getDefaultConfig() {
  return {
    actionTypes: [
      { id: "act-1", key: "浇水", label: "浇水", icon: "💧", colorBg: "bg-blue-100", colorText: "text-blue-800", enableWaterInput: true, description: "灌溉补水操作" },
      { id: "act-2", key: "施肥", label: "施肥", icon: "🧪", colorBg: "bg-amber-100", colorText: "text-amber-800", enableFertilizerInput: true, description: "根部施肥或水溶肥" },
      { id: "act-3", key: "叶面肥", label: "叶面肥", icon: "🌱", colorBg: "bg-emerald-100", colorText: "text-emerald-800", enableFertilizerInput: true, description: "叶面喷施微量元素" },
      { id: "act-4", key: "松土培土", label: "松土培土", icon: "🌾", colorBg: "bg-orange-100", colorText: "text-orange-800", description: "疏松土壤增加透气性" },
      { id: "act-5", key: "打药防虫", label: "打药防虫", icon: "🐛", colorBg: "bg-purple-100", colorText: "text-purple-800", description: "病虫害药剂喷洒" },
      { id: "act-6", key: "打顶剪枝", label: "打顶剪枝", icon: "✂️", colorBg: "bg-teal-100", colorText: "text-teal-800", description: "摘心打顶修剪枝叶" },
      { id: "act-7", key: "位置变更", label: "位置变更", icon: "📍", colorBg: "bg-rose-100", colorText: "text-rose-800", enableLocationInput: true, description: "挪动花盆摆放位置" },
      { id: "act-8", key: "成长拍照", label: "成长拍照", icon: "📷", colorBg: "bg-indigo-100", colorText: "text-indigo-800", description: "拍照记录生长阶段" },
      { id: "act-9", key: "日光照射", label: "日光照射", icon: "☀️", colorBg: "bg-yellow-100", colorText: "text-yellow-800", description: "移至日光充沛区补光" },
      { id: "act-10", key: "除草清理", label: "除草清理", icon: "🌿", colorBg: "bg-lime-100", colorText: "text-lime-800", description: "清理杂草及枯叶" },
      { id: "act-11", key: "换盆翻土", label: "换盆翻土", icon: "🪴", colorBg: "bg-stone-100", colorText: "text-stone-800", description: "更换更大花盆和营养土" },
      { id: "act-12", key: "采摘收获", label: "采摘收获", icon: "🌶️", colorBg: "bg-red-100", colorText: "text-red-800", description: "采摘成熟辣椒果实" },
      { id: "act-13", key: "人工授粉", label: "人工授粉", icon: "🌸", colorBg: "bg-fuchsia-100", colorText: "text-fuchsia-800", description: "人工辅助开花授粉" },
      { id: "act-14", key: "互助照顾", label: "互助照顾", icon: "🤝", colorBg: "bg-cyan-100", colorText: "text-cyan-800", description: "领用责任人交接或代照顾" },
      { id: "act-15", key: "所有权转移", label: "所有权转移", icon: "🔄", colorBg: "bg-slate-100", colorText: "text-slate-800", description: "植株归属权转移给其他成员" }
    ],
    growthStages: ["芽苗期", "幼苗期", "定植期", "生长期", "花蕾期", "开花期", "挂果期", "采收期", "休眠期"],
    healthStatuses: ["茁壮成长", "需要浇水", "需要施肥", "观察中", "病虫害防护", "病害隔离中", "日灼恢复中"],
    locations: ["技术部办公区", "财务办公区", "大厅展现区", "直播间", "自媒体办公区", "人事办公室", "前台与休息区"],
    fertilizers: ["磷酸二氢钾", "通用型复合肥", "水溶育苗肥", "羊粪有机肥", "奥绿缓释肥", "自制发酵液", "硝酸钾叶面肥"]
  };
}

// 配置迁移：保留已有配置（含自定义），补齐缺失的标准动作类型与枚举项（只增不减）
async function ensureConfigMigrated(env, config) {
  const standard = getDefaultConfig();
  if (!config.actionTypes || !Array.isArray(config.actionTypes) || config.actionTypes.length < 14) {
    const existingLabels = new Set((config.actionTypes || []).map(a => a.label || a.key));
    const missingStandard = standard.actionTypes.filter(def => !existingLabels.has(def.label) && !existingLabels.has(def.key));
    config.actionTypes = [...(config.actionTypes || []), ...missingStandard];
  }
  // 并集枚举项
  for (const key of ["growthStages", "healthStatuses", "locations", "fertilizers"]) {
    const base = (config[key] || []).filter(Boolean);
    const std = standard[key] || [];
    config[key] = [...base, ...std.filter(v => !base.includes(v))];
  }
  try {
    await env.DB.prepare("UPDATE system_config SET config = ?1 WHERE id = ?2").bind(JSON.stringify(config), "main").run();
  } catch (e) {
    console.error("Config migrate save error:", e);
  }
  return config;
}
__name(getDefaultConfig, "getDefaultConfig");
async function handleImageUpload(env, request) {
  try {
    const body = await request.json();
    const base64Data = body.image || body.base64 || "";
    if (!base64Data) return errorJson("\u7F3A\u5C11\u56FE\u7247\u6570\u636E");
    let b64 = base64Data;
    let ext = "jpg";
    if (b64.startsWith("data:image/")) {
      const mime = b64.substring(5, b64.indexOf(";"));
      ext = mime.split("/")[1] || "jpg";
      b64 = b64.substring(b64.indexOf(",") + 1);
    }
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = "img/" + Date.now() + "-" + Math.random().toString(36).substring(2, 8) + "." + ext;
    await env.IMAGES.put(key, binary, {
      httpMetadata: { contentType: "image/" + ext }
    });
    const url = "/r2/" + key;
    return json({ success: true, url, key });
  } catch (e) {
    return errorJson("\u56FE\u7247\u4E0A\u4F20\u5931\u8D25: " + (e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF"), 500);
  }
}
__name(handleImageUpload, "handleImageUpload");
async function handleRegister(env, request) {
  const { name, password, location, avatar } = await request.json();
  if (!name?.trim()) return errorJson("\u8BF7\u8F93\u5165\u59D3\u540D");
  const trimmedName = name.trim();
  const pwd = (password || "123").trim();
  const existing = await env.DB.prepare("SELECT id FROM users WHERE name = ?").bind(trimmedName).first();
  if (existing) return errorJson('\u6210\u5458 "' + trimmedName + '" \u5DF2\u5B58\u5728');
  const userId = "u-" + Date.now();
  await env.DB.prepare(
    "INSERT INTO users (id, name, password, location, avatar, is_admin, is_banned, registered_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)"
  ).bind(userId, trimmedName, pwd, location || "\u517B\u62A4\u533A\u57DF", avatar || "", (/* @__PURE__ */ new Date()).toISOString().split("T")[0]).run();
  const user = {
    id: userId,
    name: trimmedName,
    password: pwd,
    location: location || "\u517B\u62A4\u533A\u57DF",
    avatar: avatar || "",
    isAdmin: false,
    isBanned: false,
    registeredAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  const token = generateToken(userId);
  return json({ success: true, user, token });
}
__name(handleRegister, "handleRegister");
async function handleLogin(env, request) {
  const { name, password, location, avatar } = await request.json();
  if (!name?.trim()) return errorJson("\u8BF7\u8F93\u5165\u59D3\u540D");
  const trimmedName = name.trim();
  const pwd = (password || "123").trim();
  if (trimmedName.toLowerCase() === "admin") {
    const adminUser = {
      id: "admin-001",
      name: "admin",
      password: pwd,
      isAdmin: true,
      location: "\u7BA1\u7406\u5458\u63A7\u5236\u4E2D\u5FC3",
      registeredAt: "2026-08-01"
    };
    await env.DB.prepare(
      "INSERT OR REPLACE INTO users (id, name, password, location, is_admin, is_banned, registered_at) VALUES (?, ?, ?, ?, 1, 0, ?)"
    ).bind("admin-001", "admin", pwd, "\u7BA1\u7406\u5458\u63A7\u5236\u4E2D\u5FC3", "2026-08-01").run();
    const token2 = generateToken("admin-001");
    return json({ success: true, user: adminUser, token: token2 });
  }
  const row = await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(trimmedName).first();
  let user;
  if (row) {
    user = parseUser(row);
    if (user.isBanned) return errorJson("\u8BE5\u8D26\u53F7\u5DF2\u88AB\u7BA1\u7406\u5458\u5C01\u7981\uFF0C\u65E0\u6CD5\u767B\u5F55\uFF01\u5982\u9700\u89E3\u5C01\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u3002", 403);
    if (user.password && user.password !== pwd) {
      return errorJson("\u5BC6\u7801\u9519\u8BEF\uFF01\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u4E2A\u4EBA\u5BC6\u7801\u3002", 401);
    }
    await env.DB.prepare(
      'UPDATE users SET password = ?, location = COALESCE(NULLIF(?, ""), location), avatar = COALESCE(NULLIF(?, ""), avatar) WHERE id = ?'
    ).bind(pwd, location || "", avatar || "", user.id).run();
    user.password = pwd;
    if (location) user.location = location;
    if (avatar) user.avatar = avatar;
  } else {
    user = {
      id: "u-" + Date.now(),
      name: trimmedName,
      password: pwd,
      location: location || "\u517B\u62A4\u533A\u57DF",
      avatar: avatar || "",
      isAdmin: false,
      isBanned: false,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    await env.DB.prepare(
      "INSERT INTO users (id, name, password, location, avatar, is_admin, is_banned, registered_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)"
    ).bind(user.id, user.name, pwd, user.location || "", user.avatar || "", user.registeredAt).run();
  }
  const token = generateToken(user.id);
  return json({ success: true, user, token });
}
__name(handleLogin, "handleLogin");
async function handleAdminLogin(request) {
  const { password } = await request.json();
  if (password === "123" || password === "admin123") {
    return json({ success: true });
  }
  return errorJson("\u7BA1\u7406\u5458\u5BC6\u7801\u9519\u8BEF\uFF01", 401);
}
__name(handleAdminLogin, "handleAdminLogin");
async function handleGetPlants(env) {
  const result = await env.DB.prepare("SELECT * FROM plants ORDER BY id ASC").all();
  const plants = result.results.map(parsePlant);
  return json({ success: true, plants });
}
__name(handleGetPlants, "handleGetPlants");
async function handleCreatePlant(env, request) {
  const body = await request.json();
  const db = env.DB;
  const maxRow = await db.prepare("SELECT MAX(id) as max_id FROM plants").first();
  const newId = Number(maxRow?.max_id || 0) + 1;
  const code = String(body.code || "\u8FA3\u6912 #" + String(newId).padStart(2, "0"));
  const name = String(body.name || code);
  const owners = Array.isArray(body.owners) ? body.owners : body.ownerName ? [body.ownerName] : [];
  const avatar = String(body.avatar || "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80");
  await db.prepare(
    "INSERT INTO plants (id, code, name, claimed, owner_name, owners, primary_dept, location, status, health, planted_date, avatar, initial_avatar, care_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    newId,
    code,
    name,
    body.claimed ? 1 : 0,
    body.ownerName || null,
    JSON.stringify(owners),
    body.primaryDept || "\u529E\u516C\u533A",
    body.location || "\u529E\u516C\u533A",
    body.status || "\u82BD\u82D7\u671F",
    body.health || "\u8301\u58EE\u6210\u957F",
    body.plantedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    avatar,
    body.initialAvatar || avatar,
    Number(body.careCount || 0)
  ).run();
  const plant = {
    id: newId,
    code,
    name,
    claimed: Boolean(body.claimed),
    ownerName: body.ownerName ? String(body.ownerName) : void 0,
    owners,
    primaryDept: String(body.primaryDept || "\u529E\u516C\u533A"),
    location: String(body.location || "\u529E\u516C\u533A"),
    status: String(body.status || "\u82BD\u82D7\u671F"),
    health: String(body.health || "\u8301\u58EE\u6210\u957F"),
    plantedDate: String(body.plantedDate || ""),
    avatar,
    initialAvatar: String(body.initialAvatar || avatar),
    careCount: Number(body.careCount || 0)
  };
  return json({ success: true, plant });
}
__name(handleCreatePlant, "handleCreatePlant");
async function handleUpdatePlant(env, request, plantId) {
  const body = await request.json();
  const db = env.DB;
  const existing = await db.prepare("SELECT * FROM plants WHERE id = ?").bind(plantId).first();
  if (!existing) return errorJson("\u690D\u7269\u4E0D\u5B58\u5728", 404);
  const setClauses = [];
  const values = [];
  const fields = [
    ["code", "code"],
    ["name", "name"],
    ["owner_name", "ownerName"],
    ["primary_dept", "primaryDept"],
    ["location", "location"],
    ["status", "status"],
    ["health", "health"],
    ["planted_date", "plantedDate"],
    ["avatar", "avatar"],
    ["initial_avatar", "initialAvatar"],
    ["care_count", "careCount"],
    ["notes", "notes"],
    ["last_watered_at", "lastWateredAt"],
    ["last_fertilized_at", "lastFertilizedAt"],
    ["last_care_at", "lastCareAt"],
    ["is_deleted", "isDeleted"]
  ];
  for (const [col, key] of fields) {
    if (key in body) {
      let val = body[key];
      if (col === "claimed" || col === "is_deleted") val = val ? 1 : 0;
      setClauses.push(col + " = ?");
      values.push(val);
    }
  }
  if (body.owners) {
    setClauses.push("owners = ?");
    values.push(JSON.stringify(Array.isArray(body.owners) ? body.owners : []));
  }
  if (setClauses.length === 0) return errorJson("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5");
  values.push(plantId);
  await db.prepare("UPDATE plants SET " + setClauses.join(", ") + " WHERE id = ?").bind(...values).run();
  const updated = await db.prepare("SELECT * FROM plants WHERE id = ?").bind(plantId).first();
  return json({ success: true, plant: parsePlant(updated) });
}
__name(handleUpdatePlant, "handleUpdatePlant");
async function handleDeletePlant(env, plantId) {
  await env.DB.prepare("UPDATE plants SET is_deleted = 1 WHERE id = ?").bind(plantId).run();
  return json({ success: true, message: "\u690D\u7269\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9" });
}
__name(handleDeletePlant, "handleDeletePlant");
async function handleCreateLog(env, request) {
  const body = await request.json();
  const db = env.DB;
  const plantIds = Array.isArray(body.plantIds) ? body.plantIds : [Number(body.plantId) || 1];
  const actionType = String(body.actionType || "\u6D47\u6C34");
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const logId = "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const log = {
    id: logId,
    plantIds,
    userId: String(body.userId || "user-" + Date.now()),
    userName: String(body.userName || ""),
    userDept: body.userLocation ? String(body.userLocation) : void 0,
    userLocation: body.userLocation ? String(body.userLocation) : void 0,
    userAvatar: body.userAvatar ? String(body.userAvatar) : void 0,
    actionType,
    actionIcon: ACTION_ICONS[actionType] || "\u{1F4DD}",
    fertilizerName: body.fertilizerName ? String(body.fertilizerName) : void 0,
    fertilizerConcentration: body.fertilizerConcentration ? String(body.fertilizerConcentration) : void 0,
    locationNew: body.locationNew ? String(body.locationNew) : void 0,
    waterVolume: body.waterVolume ? String(body.waterVolume) : void 0,
    photo: body.photo ? String(body.photo) : void 0,
    notes: body.notes ? String(body.notes) : void 0,
    helpedColleagues: Array.isArray(body.helpedColleagues) ? body.helpedColleagues : [],
    createdAt: nowIso,
    likes: [],
    comments: []
  };
  await db.prepare(
    "INSERT INTO care_logs (id, plant_ids, user_id, user_name, user_dept, user_location, user_avatar, action_type, action_icon, fertilizer_name, fertilizer_concentration, location_new, water_volume, photo, notes, helped_colleagues, created_at, likes, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    log.id,
    JSON.stringify(plantIds),
    log.userId,
    log.userName,
    log.userDept || "",
    log.userLocation || "",
    log.userAvatar || "",
    log.actionType,
    log.actionIcon,
    log.fertilizerName || null,
    log.fertilizerConcentration || null,
    log.locationNew || null,
    log.waterVolume || null,
    log.photo || null,
    log.notes || null,
    JSON.stringify(log.helpedColleagues),
    nowIso,
    "[]",
    "[]"
  ).run();
  for (const pid of plantIds) {
    const plant = await db.prepare("SELECT * FROM plants WHERE id = ?").bind(pid).first();
    if (plant) {
      let newHealth = String(plant.health || "");
      if (actionType === "\u6D47\u6C34" && newHealth === "\u9700\u8981\u6D47\u6C34") newHealth = "\u8301\u58EE\u6210\u957F";
      if ((actionType === "\u65BD\u80A5" || actionType === "\u53F6\u9762\u80A5") && newHealth === "\u9700\u8981\u65BD\u80A5") newHealth = "\u8301\u58EE\u6210\u957F";
      const photo = String(body.photo || "");
      await db.prepare(
        "UPDATE plants SET care_count = care_count + 1, last_care_at = ?, last_watered_at = CASE WHEN ? = ? THEN ? ELSE last_watered_at END, last_fertilized_at = CASE WHEN ? IN (?, ?) THEN ? ELSE last_fertilized_at END, location = CASE WHEN ? = ? AND ? IS NOT NULL THEN ? ELSE location END, health = ?, avatar = CASE WHEN ? != ? THEN ? ELSE avatar END WHERE id = ?"
      ).bind(nowIso, actionType, "\u6D47\u6C34", nowIso, actionType, "\u65BD\u80A5", "\u53F6\u9762\u80A5", nowIso, actionType, "\u4F4D\u7F6E\u53D8\u66F4", body.locationNew || null, body.locationNew || null, newHealth, photo, "", photo, pid).run();
    }
  }
  return json({ success: true, log });
}
__name(handleCreateLog, "handleCreateLog");
async function handleGetLogs(env) {
  const result = await env.DB.prepare("SELECT * FROM care_logs WHERE is_deleted IS NULL OR is_deleted = 0 ORDER BY created_at DESC").all();
  const logs = result.results.map(parseLog);
  return json({ success: true, logs });
}
__name(handleGetLogs, "handleGetLogs");
async function handleUpdateLog(env, request, logId) {
  const body = await request.json();
  const existing = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  if (!existing) return errorJson("\u65E5\u5FD7\u4E0D\u5B58\u5728", 404);
  const sets = [];
  const vals = [];
  const map = {
    notes: "notes",
    userName: "user_name",
    userDept: "user_dept",
    userLocation: "user_location",
    userAvatar: "user_avatar",
    fertilizerName: "fertilizer_name",
    fertilizerConcentration: "fertilizer_concentration",
    locationNew: "location_new",
    waterVolume: "water_volume",
    photo: "photo",
    createdAt: "created_at",
    isDeleted: "is_deleted"
  };
  for (const [key, col] of Object.entries(map)) {
    if (key in body) {
      if (key === "isDeleted") {
        sets.push(col + " = ?");
        vals.push(body[key] ? 1 : 0);
      } else {
        sets.push(col + " = ?");
        vals.push(body[key]);
      }
    }
  }
  if (body.actionType) {
    sets.push("action_type = ?");
    vals.push(body.actionType);
  }
  if (body.actionIcon) {
    sets.push("action_icon = ?");
    vals.push(body.actionIcon);
  }
  if (body.helpedColleagues) {
    sets.push("helped_colleagues = ?");
    vals.push(JSON.stringify(body.helpedColleagues));
  }
  if (body.plantIds) {
    sets.push("plant_ids = ?");
    vals.push(JSON.stringify(body.plantIds));
  }
  if (sets.length === 0) return errorJson("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5");
  vals.push(logId);
  await env.DB.prepare("UPDATE care_logs SET " + sets.join(", ") + " WHERE id = ?").bind(...vals).run();
  const updated = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  return json({ success: true, log: parseLog(updated) });
}
__name(handleUpdateLog, "handleUpdateLog");
async function handleDeleteLog(env, logId) {
  await env.DB.prepare("DELETE FROM care_logs WHERE id = ?").bind(logId).run();
  return json({ success: true, message: "\u65E5\u5FD7\u5DF2\u5220\u9664" });
}
__name(handleDeleteLog, "handleDeleteLog");
async function handleLikeLog(env, request, logId) {
  const { userName } = await request.json();
  if (!userName) return errorJson("\u9700\u8981\u59D3\u540D");
  const row = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  if (!row) return errorJson("\u52A8\u6001\u4E0D\u5B58\u5728", 404);
  const log = parseLog(row);
  const idx = log.likes.findIndex((l) => l.userName === userName);
  if (idx >= 0) {
    log.likes.splice(idx, 1);
  } else {
    log.likes.push({ userName, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
  }
  await env.DB.prepare("UPDATE care_logs SET likes = ? WHERE id = ?").bind(JSON.stringify(log.likes), logId).run();
  return json({ success: true, likes: log.likes });
}
__name(handleLikeLog, "handleLikeLog");
async function handleCommentLog(env, request, logId) {
  const { userName, text } = await request.json();
  if (!userName || !text) return errorJson("\u8BF7\u586B\u5199\u8BC4\u8BBA\u5185\u5BB9");
  const row = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  if (!row) return errorJson("\u52A8\u6001\u4E0D\u5B58\u5728", 404);
  const log = parseLog(row);
  const comment = {
    id: "c-" + Date.now(),
    userName,
    text,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  log.comments.push(comment);
  await env.DB.prepare("UPDATE care_logs SET comments = ? WHERE id = ?").bind(JSON.stringify(log.comments), logId).run();
  return json({ success: true, comment });
}
__name(handleCommentLog, "handleCommentLog");
// v13: 删除某条日志下的评论
async function handleDeleteComment(env, logId, commentId) {
  const row = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  if (!row) return errorJson("\u52A8\u6001\u4E0D\u5B58\u5728", 404);
  const log = parseLog(row);
  log.comments = (log.comments || []).filter((c) => c.id !== commentId);
  await env.DB.prepare("UPDATE care_logs SET comments = ? WHERE id = ?").bind(JSON.stringify(log.comments), logId).run();
  return json({ success: true, comments: log.comments });
}
__name(handleDeleteComment, "handleDeleteComment");
// v13: 软删除 / 恢复动态（isDeleted）
async function handleUpdateLogStatus(env, request, logId) {
  const { isDeleted } = await request.json();
  const row = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  if (!row) return errorJson("\u52A8\u6001\u4E0D\u5B58\u5728", 404);
  await env.DB.prepare("UPDATE care_logs SET is_deleted = ? WHERE id = ?").bind(isDeleted ? 1 : 0, logId).run();
  const updated = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?").bind(logId).first();
  return json({ success: true, log: parseLog(updated) });
}
__name(handleUpdateLogStatus, "handleUpdateLogStatus");
async function handleGetUsers(env) {
  const result = await env.DB.prepare("SELECT * FROM users ORDER BY registered_at DESC").all();
  const users = result.results.map(parseUser);
  const safe = users.map(({ password, ...u }) => u);
  return json({ success: true, users: safe });
}
__name(handleGetUsers, "handleGetUsers");
async function handleUpdateUser(env, request, userId) {
  const body = await request.json();
  const existing = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!existing) return errorJson("\u6210\u5458\u4E0D\u5B58\u5728", 404);
  const sets = [];
  const vals = [];
  if (body.name !== void 0) {
    sets.push("name = ?");
    vals.push(body.name);
  }
  if (body.password !== void 0) {
    sets.push("password = ?");
    vals.push(body.password);
  }
  if (body.location !== void 0) {
    sets.push("location = ?");
    vals.push(body.location);
  }
  if (body.avatar !== void 0) {
    sets.push("avatar = ?");
    vals.push(body.avatar);
  }
  if (body.isAdmin !== void 0) {
    sets.push("is_admin = ?");
    vals.push(body.isAdmin ? 1 : 0);
  }
  if (body.isBanned !== void 0) {
    sets.push("is_banned = ?");
    vals.push(body.isBanned ? 1 : 0);
  }
  if (sets.length === 0) return errorJson("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5");
  vals.push(userId);
  await env.DB.prepare("UPDATE users SET " + sets.join(", ") + " WHERE id = ?").bind(...vals).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  const user = parseUser(updated);
  const { password, ...safe } = user;
  return json({ success: true, user: safe });
}
__name(handleUpdateUser, "handleUpdateUser");
async function handleResetPassword(env, request, userId) {
  const { newPassword } = await request.json();
  const existing = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!existing) return errorJson("\u6210\u5458\u4E0D\u5B58\u5728", 404);
  await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(newPassword || "123", userId).run();
  return json({ success: true, message: "\u5DF2\u91CD\u7F6E\u5BC6\u7801\u4E3A: " + (newPassword || "123") });
}
__name(handleResetPassword, "handleResetPassword");
async function handleGetConfig(env) {
  const row = await env.DB.prepare("SELECT config FROM system_config WHERE id = ?1").bind("main").first();
  if (!row) {
    const cfg = getDefaultConfig();
    try {
      await env.DB.prepare("INSERT OR REPLACE INTO system_config (id, config) VALUES (?1, ?2)").bind("main", JSON.stringify(cfg)).run();
    } catch (e) {
      console.error("Config init error:", e);
    }
    return json({ success: true, config: cfg });
  }
  let config = safeJsonParse(String(row.config), getDefaultConfig());
  config = await ensureConfigMigrated(env, config);
  return json({ success: true, config });
}
__name(handleGetConfig, "handleGetConfig");
async function handleUpdateConfig(env, request) {
  const body = await request.json();
  await env.DB.prepare("INSERT OR REPLACE INTO system_config (id, config) VALUES (?1, ?2)").bind("main", JSON.stringify(body)).run();
  return json({ success: true, config: body, message: "\u7CFB\u7EDF\u914D\u7F6E\u5DF2\u66F4\u65B0" });
}
__name(handleUpdateConfig, "handleUpdateConfig");
async function handleCreateActionType(env, request) {
  const body = await request.json();
  const row = await env.DB.prepare("SELECT config FROM system_config WHERE id = ?1").bind("main").first();
  const config = row ? safeJsonParse(String(row.config), getDefaultConfig()) : getDefaultConfig();
  const newAction = {
    id: String(body.id || "act-" + Date.now()),
    key: String(body.label || body.key || "\u65B0\u64CD\u4F5C"),
    label: String(body.label || body.key || "\u65B0\u64CD\u4F5C"),
    icon: String(body.icon || "\u{1F4DD}"),
    colorBg: String(body.colorBg || "bg-emerald-100"),
    colorText: String(body.colorText || "text-emerald-800"),
    description: body.description ? String(body.description) : "",
    enableWaterInput: Boolean(body.enableWaterInput),
    enableFertilizerInput: Boolean(body.enableFertilizerInput),
    enableLocationInput: Boolean(body.enableLocationInput)
  };
  const idx = config.actionTypes.findIndex((a) => a.id === newAction.id || a.label === newAction.label);
  if (idx >= 0) {
    config.actionTypes[idx] = newAction;
  } else {
    config.actionTypes.push(newAction);
  }
  await env.DB.prepare("UPDATE system_config SET config = ?1 WHERE id = ?2").bind(JSON.stringify(config), "main").run();
  return json({ success: true, config, actionType: newAction, message: "\u5DF2\u4FDD\u5B58\u64CD\u4F5C: " + newAction.label });
}
__name(handleCreateActionType, "handleCreateActionType");
async function handleDeleteActionType(env, id) {
  const row = await env.DB.prepare("SELECT config FROM system_config WHERE id = ?1").bind("main").first();
  const config = row ? safeJsonParse(String(row.config), getDefaultConfig()) : getDefaultConfig();
  config.actionTypes = config.actionTypes.filter((a) => a.id !== id && a.label !== id && a.key !== id);
  await env.DB.prepare("UPDATE system_config SET config = ?1 WHERE id = ?2").bind(JSON.stringify(config), "main").run();
  return json({ success: true, config, message: "\u5DF2\u5220\u9664\u8BE5\u64CD\u4F5C\u7C7B\u578B" });
}
__name(handleDeleteActionType, "handleDeleteActionType");
async function handleGetStats(env) {
  const db = env.DB;
  const [plantsRes, logsRes, usersRes] = await Promise.all([
    db.prepare("SELECT * FROM plants WHERE is_deleted = 0").all(),
    db.prepare("SELECT * FROM care_logs").all(),
    db.prepare("SELECT * FROM users").all()
  ]);
  const plants = plantsRes.results.map(parsePlant);
  const logs = logsRes.results.map(parseLog);
  const users = usersRes.results.map(parseUser);
  const gardenerStats = {};
  logs.forEach((log) => {
    if (!gardenerStats[log.userName]) {
      gardenerStats[log.userName] = { name: log.userName, dept: log.userLocation || "\u517B\u62A4\u533A\u57DF", count: 0, helpedCount: 0, photosCount: 0 };
    }
    gardenerStats[log.userName].count += 1;
    if (log.helpedColleagues && log.helpedColleagues.length) gardenerStats[log.userName].helpedCount += log.helpedColleagues.length;
    if (log.photo) gardenerStats[log.userName].photosCount += 1;
  });
  const topGardeners = Object.values(gardenerStats).sort((a, b) => b.count - a.count).slice(0, 5);
  const topHelpers = Object.values(gardenerStats).sort((a, b) => b.helpedCount - a.helpedCount).slice(0, 5);
  const topPhotographers = Object.values(gardenerStats).sort((a, b) => b.photosCount - a.photosCount).slice(0, 5);
  const usersList = users.map((u) => {
    const careCount = logs.filter((l) => l.userName === u.name || l.userId === u.id).length;
    let helpedCount = 0;
    logs.forEach((l) => {
      if ((l.userName === u.name || l.userId === u.id) && l.helpedColleagues) helpedCount += l.helpedColleagues.length;
    });
    return { id: u.id, name: u.name, avatar: u.avatar || "", location: u.location || "\u517B\u62A4\u533A\u57DF", isAdmin: !!u.isAdmin, careCount, helpedCount, registeredAt: u.registeredAt || "2026-08-01" };
  });
  usersList.sort((a, b) => b.careCount - a.careCount);
  return json({ success: true, totalLogs: logs.length, totalCareLogs: logs.length, totalUsers: users.length, users: usersList, thrivingPlants: plants.filter((p) => p.health === "\u8301\u58EE\u6210\u957F").length, thirstyPlants: plants.filter((p) => p.health === "\u9700\u8981\u6D47\u6C34").length, topGardeners, topHelpers, topPhotographers });
}
__name(handleGetStats, "handleGetStats");
async function handleAiDiagnose(env, request) {
  try {
    const { question, plantName, healthStatus } = await request.json();
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return json({ answer: "\u5173\u4E8E " + (plantName || "\u8FA3\u6912\u82D7") + "\uFF08\u72B6\u6001\uFF1A" + (healthStatus || "\u6B63\u5E38") + "\uFF09\u7684\u54A8\u8BE2\u3002\u5EFA\u8BAE\u4FDD\u6301\u6BCF\u65E5\u9002\u5EA6\u6563\u5149\u7167\u5C04\uFF0C\u907F\u514D\u79EF\u6C34\uFF0C\u4FDD\u6301\u901A\u98CE\u826F\u597D\uFF1B\u5982\u9047\u866B\u5BB3\u53EF\u9002\u5F53\u64E6\u62ED\u6216\u4F7F\u7528\u65E0\u6BD2\u6709\u673A\u9664\u866B\u6DB2\u3002" });
    const prompt = "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u8FA3\u6912\u79CD\u690DAI\u52A9\u624B\u3002\u8BF7\u7528\u53CB\u597D\u3001\u4E13\u4E1A\u7684\u8BED\u6C14\u56DE\u7B54\u7528\u6237\u5173\u4E8E\u8FA3\u6912\u517B\u62A4\u7684\u95EE\u9898\u3002\u690D\u7269\u540D\u79F0\uFF1A" + (plantName || "\u8FA3\u6912") + " \u5F53\u524D\u72B6\u6001\uFF1A" + (healthStatus || "\u6B63\u5E38") + " \u7528\u6237\u95EE\u9898\uFF1A" + question + " \u8BF7\u7ED9\u51FA\u7B80\u660E\u627C\u8981\u3001\u5B9E\u7528\u7684\u517B\u62A4\u5EFA\u8BAE\u3002";
    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } })
    });
    if (!geminiRes.ok) throw new Error("Gemini API error: " + geminiRes.status);
    const data = await geminiRes.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "\u6682\u65E0\u56DE\u590D";
    return json({ answer });
  } catch (e) {
    return json({ answer: "\u3010\u519C\u5C0F\u86D9\u690D\u7269AI\u52A9\u624B\u667A\u80FD\u63D0\u793A\u3011\u5EFA\u8BAE\u4FDD\u6301\u6BCF\u65E5\u9002\u5EA6\u6563\u5149\u7167\u5C04\uFF0C\u907F\u514D\u79EF\u6C34\uFF0C\u4FDD\u6301\u901A\u98CE\u826F\u597D\u3002" });
  }
}
__name(handleAiDiagnose, "handleAiDiagnose");
async function handleResetPlant(env, plantId) {
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  if (!plant) return errorJson("\u690D\u7269\u4E0D\u5B58\u5728", 404);
  await env.DB.prepare("UPDATE plants SET claimed = 0, owner_name = NULL, owners = ?1, status = ?2, health = ?3, care_count = 0, last_watered_at = NULL, last_fertilized_at = NULL, last_care_at = NULL, notes = NULL, is_deleted = 0, avatar = COALESCE(NULLIF(initial_avatar, ?4), avatar) WHERE id = ?5").bind("[]", "\u82BD\u82D7\u671F", "\u8301\u58EE\u6210\u957F", "", plantId).run();
  const updated = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  return json({ success: true, plant: parsePlant(updated), message: "\u5DF2\u91CD\u7F6E\u4E3A\u521D\u59CB\u72B6\u6001" });
}
__name(handleResetPlant, "handleResetPlant");
// v13: 认领植物（每个编号/二维码只能被认领一次）
async function handleClaimPlant(env, request, plantId) {
  const body = await request.json();
  const userName = (body.userName || body.name || "").trim();
  if (!userName) return errorJson("\u8BF7\u63D0\u4F9B\u9886\u7528\u4EBA\u59D3\u540D");
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  if (!plant) return errorJson("\u627E\u4E0D\u5230\u6B64\u76C6\u690D\u682A", 404);
  if (plant.claimed || (plant.owner_name && String(plant.owner_name).trim() !== "")) {
    return errorJson("\u8BE5\u690D\u682A\u7F16\u53F7\u4E0E\u4E8C\u7EF4\u7801\u3010" + (plant.code || plantId) + "\u3011\u5DF2\u88AB\u3010" + (plant.owner_name || "\u4ED6\u4EBA") + "\u3011\u6210\u529F\u8BA4\u9886\u7ED1\u5B9A\uFF01\u6BCF\u4E00\u4E2A\u4E8C\u7EF4\u7801\u4E0E\u7F16\u53F7\u53EA\u80FD\u88AB\u8BA4\u9886\u4E00\u6B21\uFF0C\u65E0\u6CD5\u91CD\u590D\u8BA4\u9886\u7ED1\u5B9A\uFF01");
  }
  const location = body.location || plant.location || "\u517B\u62A4\u533A\u57DF";
  await env.DB.prepare("UPDATE plants SET claimed = 1, owner_name = ?1, owners = ?2, location = ?3 WHERE id = ?4").bind(userName, JSON.stringify([userName]), location, plantId).run();
  const updated = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  let user = await env.DB.prepare("SELECT * FROM users WHERE name = ?1").bind(userName).first();
  if (user) {
    const plantIds = safeJsonParse(String(user.plant_ids || "[]"), []);
    if (!plantIds.includes(plantId)) plantIds.push(plantId);
    await env.DB.prepare("UPDATE users SET plant_ids = ?1, location = ?2 WHERE id = ?3").bind(JSON.stringify(plantIds), location, user.id).run();
    user = { ...user, plant_ids: JSON.stringify(plantIds), location };
  } else {
    const userId = body.userId || "u-" + Date.now();
    await env.DB.prepare("INSERT INTO users (id, name, password, location, plant_ids, is_admin, is_banned, registered_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)").bind(userId, userName, "123", location, JSON.stringify([plantId]), new Date().toISOString().split("T")[0]).run();
    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  }
  return json({ success: true, plant: parsePlant(updated), user: parseUser(user) });
}
__name(handleClaimPlant, "handleClaimPlant");
// v13: 所有权转让
async function handleTransferPlant(env, request) {
  const { plantId, fromUserName, toUserName, reason } = await request.json();
  if (!plantId || !fromUserName || !toUserName) return errorJson("\u8F6C\u8BA9\u53C2\u6570\u4E0D\u5B8C\u6574");
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(parseInt(plantId)).first();
  if (!plant) return errorJson("\u76C6\u683D\u672A\u627E\u5230", 404);
  await env.DB.prepare("UPDATE plants SET claimed = 1, owner_name = ?1, owners = ?2 WHERE id = ?3").bind(toUserName, JSON.stringify([toUserName]), plant.id).run();
  const updated = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plant.id).first();
  let toUser = await env.DB.prepare("SELECT * FROM users WHERE name = ?1").bind(toUserName).first();
  if (toUser) {
    const plantIds = safeJsonParse(String(toUser.plant_ids || "[]"), []);
    if (!plantIds.includes(plant.id)) plantIds.push(plant.id);
    await env.DB.prepare("UPDATE users SET plant_ids = ?1 WHERE id = ?2").bind(JSON.stringify(plantIds), toUser.id).run();
  } else {
    const userId = "u-" + Date.now();
    await env.DB.prepare("INSERT INTO users (id, name, password, location, plant_ids, is_admin, is_banned, registered_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)").bind(userId, toUserName, "123", plant.location || "\u517B\u62A4\u533A\u57DF", JSON.stringify([plant.id]), new Date().toISOString().split("T")[0]).run();
  }
  const nowIso = new Date().toISOString();
  const logId = "log-" + Date.now();
  const notes = "\u3010\u6240\u6709\u6743\u8F6C\u79FB\u3011" + fromUserName + " \u5DF2\u5C06 " + (plant.code || ("\u8FA3\u6912 #" + plant.id)) + " \u7684\u6240\u6709\u6743\u767B\u8BB0\u8F6C\u8BA9\u7ED9\u3010" + toUserName + "\u3011\u3002\u539F\u56E0\uFF1A" + (reason || "\u4EA4\u63A5\u7167\u987E");
  await env.DB.prepare("INSERT INTO care_logs (id, plant_ids, user_id, user_name, action_type, action_icon, notes, created_at, likes, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(logId, JSON.stringify([plant.id]), "system", fromUserName, "\u6240\u6709\u6743\u8F6C\u79FB", "\u{1F381}", notes, nowIso, "[]", "[]").run();
  const logRow = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?1").bind(logId).first();
  return json({ success: true, plant: parsePlant(updated), log: parseLog(logRow) });
}
__name(handleTransferPlant, "handleTransferPlant");
// v13: 管理员封禁/解封用户
async function handleAdminBanUser(env, request, userId) {
  const { isBanned } = await request.json();
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  if (!user) return errorJson("\u6210\u5458\u4E0D\u5B58\u5728", 404);
  if (user.is_admin) return errorJson("\u4E0D\u80FD\u5C01\u7981\u7BA1\u7406\u5458\u8D26\u53F7");
  await env.DB.prepare("UPDATE users SET is_banned = ?1 WHERE id = ?2").bind(isBanned ? 1 : 0, userId).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  return json({ success: true, user: parseUser(updated), message: isBanned ? "\u5DF2\u5C01\u7981\u6210\u5458\u3010" + user.name + "\u3011" : "\u5DF2\u89E3\u5C01\u6210\u5458\u3010" + user.name + "\u3011" });
}
__name(handleAdminBanUser, "handleAdminBanUser");
// v13: 管理员取消认领
async function handleUnclaimPlant(env, plantId) {
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  if (!plant) return errorJson("\u690D\u682A\u672A\u627E\u5230", 404);
  await env.DB.prepare("UPDATE plants SET claimed = 0, owner_name = NULL, owners = ?1 WHERE id = ?2").bind("[]", plantId).run();
  const updated = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  return json({ success: true, plant: parsePlant(updated) });
}
__name(handleUnclaimPlant, "handleUnclaimPlant");
// 补齐: 管理员将植物移入回收站
async function handleRecyclePlant(env, plantId) {
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  if (!plant) return errorJson("\u627E\u4E0D\u5230\u6B64\u690D\u7269", 404);
  await env.DB.prepare("UPDATE plants SET is_deleted = 1 WHERE id = ?1").bind(plantId).run();
  return json({ success: true, message: "\u5DF2\u5C06\u690D\u7269\u3010" + (plant.code || plantId) + "\u3011\u79FB\u5165\u5783\u573E\u6876" });
}
__name(handleRecyclePlant, "handleRecyclePlant");
// 补齐: 管理员从回收站恢复植物
async function handleRestorePlant(env, plantId) {
  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?1").bind(plantId).first();
  if (!plant) return errorJson("\u627E\u4E0D\u5230\u6B64\u690D\u7269", 404);
  await env.DB.prepare("UPDATE plants SET is_deleted = 0 WHERE id = ?1").bind(plantId).run();
  return json({ success: true, message: "\u5DF2\u5C06\u690D\u7269\u3010" + (plant.code || plantId) + "\u3011\u4ECE\u5783\u573E\u6876\u6062\u590D\uFF01" });
}
__name(handleRestorePlant, "handleRestorePlant");
// 补齐: 管理员批量创建植物
async function handleBatchCreatePlants(env, request) {
  const body = await request.json();
  const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 50);
  const prefix = String(body.prefix || "\u8FA3\u6912");
  const location = String(body.location || "\u6280\u672F\u90E8\u529E\u516C\u533A");
  const status = String(body.status || "\u82BD\u82D7\u671F");
  const health = String(body.health || "\u8301\u58EE\u6210\u957F");
  const maxRow = await env.DB.prepare("SELECT MAX(id) AS maxId FROM plants").first();
  let maxId = Number(maxRow && maxRow.maxId ? maxRow.maxId : 0);
  const defaultImages = [
    "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80"
  ];
  const createdPlants = [];
  for (let i = 1; i <= count; i++) {
    const newId = maxId + i;
    const padNum = newId < 10 ? "0" + newId : String(newId);
    const code = prefix + " #" + padNum;
    const img = defaultImages[(newId - 1) % defaultImages.length];
    const plantedDate = new Date().toISOString().split("T")[0];
    await env.DB.prepare(
      "INSERT INTO plants (id, code, name, claimed, owners, primary_dept, location, status, health, planted_date, avatar, initial_avatar, care_count, is_deleted) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)"
    ).bind(newId, code, code, "[]", location, location, status, health, plantedDate, img, img).run();
    createdPlants.push({ id: newId, code, name: code, claimed: false, owners: [], primaryDept: location, location, status, health, plantedDate, avatar: img, initialAvatar: img, careCount: 0 });
  }
  return json({ success: true, plants: createdPlants, message: "\u5DF2\u6210\u529F\u6279\u91CF\u589E\u52A0 " + count + " \u76C6\u8FA3\u6912\u82D7\uFF01" });
}
__name(handleBatchCreatePlants, "handleBatchCreatePlants");
// 补齐: 管理员删除用户（同时释放其认领的植物）
async function handleAdminDeleteUser(env, userId) {
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  if (!user) return errorJson("\u6210\u5458\u4E0D\u5B58\u5728", 404);
  await env.DB.prepare("UPDATE plants SET claimed = 0, owner_name = NULL, owners = ?1 WHERE owner_name = ?2 OR owners LIKE ?3").bind("[]", user.name, "%\"" + user.name + "\"%").run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(userId).run();
  return json({ success: true, message: "\u5DF2\u6210\u529F\u5220\u9664\u6210\u5458\u3010" + user.name + "\u3011" });
}
__name(handleAdminDeleteUser, "handleAdminDeleteUser");
async function handleGetRecycleBin(env) {
  const result = await env.DB.prepare("SELECT * FROM plants WHERE is_deleted = 1 ORDER BY id").all();
  return json({ success: true, plants: result.results.map(parsePlant) });
}
__name(handleGetRecycleBin, "handleGetRecycleBin");
async function handlePermanentDeletePlant(env, plantId) {
  await env.DB.prepare("DELETE FROM plants WHERE id = ?1").bind(plantId).run();
  return json({ success: true, message: "\u5DF2\u6C38\u4E45\u5220\u9664" });
}
__name(handlePermanentDeletePlant, "handlePermanentDeletePlant");
async function handleAdminCreateUser(env, request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return errorJson("\u5FC5\u987B\u586B\u5199\u6210\u5458\u59D3\u540D");
  const existing = await env.DB.prepare("SELECT id FROM users WHERE name = ?1").bind(name).first();
  if (existing) return errorJson("\u6210\u5458 " + name + " \u5DF2\u5B58\u5728");
  const userId = "u-" + Date.now();
  await env.DB.prepare("INSERT INTO users (id, name, password, dept, location, avatar, plant_ids, is_admin, is_banned, registered_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)").bind(userId, name, body.password || "888888", body.dept || "", body.location || "", body.avatar || "", JSON.stringify(body.plantIds || []), body.isAdmin ? 1 : 0, body.isBanned ? 1 : 0, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]).run();
  return json({ success: true, user: { id: userId, name, password: body.password || "888888", dept: body.dept || "", location: body.location || "", avatar: body.avatar || "", plantIds: body.plantIds || [], isAdmin: !!body.isAdmin, isBanned: !!body.isBanned, registeredAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] }, message: "\u5DF2\u6210\u529F\u521B\u5EFA\u6210\u5458\u8D26\u53F7: " + name });
}
__name(handleAdminCreateUser, "handleAdminCreateUser");
async function handleAdminUpdateUser(env, request, userId) {
  const body = await request.json();
  const existing = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  if (!existing) return errorJson("\u6210\u5458\u4E0D\u5B58\u5728", 404);
  const sets = [];
  const vals = [];
  if (body.name !== void 0) {
    sets.push("name = ?");
    vals.push(body.name);
  }
  if (body.password !== void 0) {
    sets.push("password = ?");
    vals.push(body.password);
  }
  if (body.dept !== void 0) {
    sets.push("dept = ?");
    vals.push(body.dept);
  }
  if (body.location !== void 0) {
    sets.push("location = ?");
    vals.push(body.location);
  }
  if (body.avatar !== void 0) {
    sets.push("avatar = ?");
    vals.push(body.avatar);
  }
  if (body.isAdmin !== void 0) {
    sets.push("is_admin = ?");
    vals.push(body.isAdmin ? 1 : 0);
  }
  if (body.isBanned !== void 0) {
    sets.push("is_banned = ?");
    vals.push(body.isBanned ? 1 : 0);
  }
  if (body.plantIds !== void 0) {
    sets.push("plant_ids = ?");
    vals.push(JSON.stringify(body.plantIds));
  }
  if (sets.length === 0) return errorJson("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5");
  vals.push(userId);
  await env.DB.prepare("UPDATE users SET " + sets.join(", ") + " WHERE id = ?").bind(...vals).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(userId).first();
  return json({ success: true, user: parseUser(updated) });
}
__name(handleAdminUpdateUser, "handleAdminUpdateUser");
async function handleAdminCreateLog(env, request) {
  const body = await request.json();
  const actionType = String(body.actionType || "\u6D47\u6C34");
  const logId = "log-" + Date.now();
  const log = {
    id: logId,
    plantIds: Array.isArray(body.plantIds) ? body.plantIds : [1],
    userId: String(body.userId || "u-admin"),
    userName: String(body.userName || "\u7BA1\u7406\u5458"),
    userDept: body.userDept ? String(body.userDept) : "\u7BA1\u7406\u90E8",
    userLocation: body.userLocation ? String(body.userLocation) : "\u529E\u516C\u533A",
    userAvatar: body.userAvatar ? String(body.userAvatar) : "",
    actionType,
    actionIcon: ACTION_ICONS[actionType] || "\u{1F4DD}",
    fertilizerName: body.fertilizerName || void 0,
    fertilizerConcentration: body.fertilizerConcentration || void 0,
    locationNew: body.locationNew || void 0,
    waterVolume: body.waterVolume || void 0,
    photo: body.photo || void 0,
    notes: body.notes || void 0,
    helpedColleagues: Array.isArray(body.helpedColleagues) ? body.helpedColleagues : [],
    createdAt: String(body.createdAt || (/* @__PURE__ */ new Date()).toLocaleString("zh-CN")),
    likes: [],
    comments: []
  };
  await env.DB.prepare("INSERT INTO care_logs (id, plant_ids, user_id, user_name, user_dept, user_location, user_avatar, action_type, action_icon, fertilizer_name, fertilizer_concentration, location_new, water_volume, photo, notes, helped_colleagues, created_at, likes, comments) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)").bind(log.id, JSON.stringify(log.plantIds), log.userId, log.userName, log.userDept || "", log.userLocation || "", log.userAvatar || "", log.actionType, log.actionIcon, log.fertilizerName || null, log.fertilizerConcentration || null, log.locationNew || null, log.waterVolume || null, log.photo || null, log.notes || null, JSON.stringify(log.helpedColleagues), log.createdAt, "[]", "[]").run();
  return json({ success: true, log, message: "\u5DF2\u6210\u529F\u624B\u52A8\u6DFB\u52A0\u517B\u62A4\u65E5\u5FD7" });
}
__name(handleAdminCreateLog, "handleAdminCreateLog");
async function handleAdminUpdateLog(env, request, logId) {
  const body = await request.json();
  const existing = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?1").bind(logId).first();
  if (!existing) return errorJson("\u65E5\u5FD7\u4E0D\u5B58\u5728", 404);
  const sets = [];
  const vals = [];
  const colMap = { userName: "user_name", userDept: "user_dept", userLocation: "user_location", userAvatar: "user_avatar", actionType: "action_type", actionIcon: "action_icon", fertilizerName: "fertilizer_name", fertilizerConcentration: "fertilizer_concentration", locationNew: "location_new", waterVolume: "water_volume", createdAt: "created_at" };
  for (const [key, value] of Object.entries(body)) {
    const col = colMap[key] || key;
    if (col === "plantIds") {
      sets.push("plant_ids = ?");
      vals.push(JSON.stringify(value));
    } else if (col === "helpedColleagues") {
      sets.push("helped_colleagues = ?");
      vals.push(JSON.stringify(value));
    } else if (col === "likes") {
      sets.push("likes = ?");
      vals.push(JSON.stringify(value));
    } else if (col === "comments") {
      sets.push("comments = ?");
      vals.push(JSON.stringify(value));
    } else if (col !== "id") {
      sets.push(col + " = ?");
      vals.push(value);
    }
  }
  if (sets.length === 0) return errorJson("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5");
  vals.push(logId);
  await env.DB.prepare("UPDATE care_logs SET " + sets.join(", ") + " WHERE id = ?").bind(...vals).run();
  const updated = await env.DB.prepare("SELECT * FROM care_logs WHERE id = ?1").bind(logId).first();
  return json({ success: true, log: parseLog(updated) });
}
__name(handleAdminUpdateLog, "handleAdminUpdateLog");
async function handleAdminDeleteLog(env, logId) {
  await env.DB.prepare("DELETE FROM care_logs WHERE id = ?1").bind(logId).run();
  return json({ success: true, message: "\u5DF2\u6210\u529F\u5220\u9664\u8BE5\u6761\u517B\u62A4\u65E5\u5FD7" });
}
__name(handleAdminDeleteLog, "handleAdminDeleteLog");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (pathname.startsWith("/r2/")) {
      const key = pathname.substring(4);
      const obj = await env.IMAGES.get(key);
      if (!obj) return errorJson("\u56FE\u7247\u672A\u627E\u5230", 404);
      const headers = new Headers(corsHeaders());
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(obj.body, { headers });
    }
    if (pathname.startsWith("/api/")) {
      try {
        if (pathname === "/api/register" && method === "POST") return handleRegister(env, request);
        if ((pathname === "/api/login" || pathname === "/api/auth") && method === "POST") return handleLogin(env, request);
        if (pathname === "/api/admin/login" && method === "POST") return handleAdminLogin(request);
        if (pathname === "/api/upload" && method === "POST") return handleImageUpload(env, request);
        if (pathname === "/api/plants" && method === "GET") return handleGetPlants(env);
        if (pathname === "/api/plants" && method === "POST") return handleCreatePlant(env, request);
        if (pathname === "/api/plants/transfer" && method === "POST") return handleTransferPlant(env, request);
        const plantMatch = pathname.match(new RegExp("^\\/api\\/plants\\/(\\d+)$"));
        if (plantMatch) {
          const pid = parseInt(plantMatch[1]);
          if (method === "PUT") return handleUpdatePlant(env, request, pid);
          if (method === "DELETE") return handleDeletePlant(env, pid);
          if (method === "POST") return handleClaimPlant(env, request, pid);
        }
        const plantClaimMatch = pathname.match(new RegExp("^\\/api\\/plants\\/(\\d+)/claim$"));
        if (plantClaimMatch && method === "POST") return handleClaimPlant(env, request, parseInt(plantClaimMatch[1]));
        if (pathname === "/api/logs" && method === "GET") return handleGetLogs(env);
        if (pathname === "/api/logs" && method === "POST") return handleCreateLog(env, request);
        const logMatch = pathname.match(new RegExp("^\\/api\\/logs\\/([^/]+)$"));
        if (logMatch) {
          const lid = logMatch[1];
          if (method === "PUT") return handleUpdateLog(env, request, lid);
          if (method === "DELETE") return handleDeleteLog(env, lid);
        }
        const logLikeMatch = pathname.match(new RegExp("^\\/api\\/logs\\/([^/]+)/like$"));
        if (logLikeMatch && method === "POST") return handleLikeLog(env, request, logLikeMatch[1]);
        const logCommentMatch = pathname.match(new RegExp("^\\/api\\/logs\\/([^/]+)/comments?$"));
        if (logCommentMatch && method === "POST") return handleCommentLog(env, request, logCommentMatch[1]);
        const logCommentDelMatch = pathname.match(new RegExp("^\\/api\\/logs\\/([^/]+)/comments?\\/([^/]+)$"));
        if (logCommentDelMatch && method === "DELETE") return handleDeleteComment(env, logCommentDelMatch[1], logCommentDelMatch[2]);
        const logStatusMatch = pathname.match(new RegExp("^\\/api\\/logs\\/([^/]+)/status$"));
        if (logStatusMatch && method === "PUT") return handleUpdateLogStatus(env, request, logStatusMatch[1]);
        if (pathname === "/api/users" && method === "GET") return handleGetUsers(env);
        const userMatch = pathname.match(new RegExp("^\\/api\\/users\\/([^/]+)$"));
        if (userMatch && method === "PUT") return handleUpdateUser(env, request, userMatch[1]);
        const resetPwdMatch = pathname.match(new RegExp("^\\/api\\/admin\\/users\\/([^/]+)/reset-password$"));
        if (resetPwdMatch && method === "POST") return handleResetPassword(env, request, resetPwdMatch[1]);
        if ((pathname === "/api/config" || pathname === "/api/system/config") && method === "GET") return handleGetConfig(env);
        if ((pathname === "/api/config" || pathname === "/api/system/config") && method === "PUT") return handleUpdateConfig(env, request);
        if ((pathname === "/api/action-types" || pathname === "/api/system/action-types") && method === "POST") return handleCreateActionType(env, request);
        const actionDelMatch = pathname.match(new RegExp("^\\/api\\/(?:system\\/)?action-types\\/([^/]+)$"));
        if (actionDelMatch && method === "DELETE") return handleDeleteActionType(env, actionDelMatch[1]);
        if (pathname === "/api/stats" && method === "GET") return handleGetStats(env);
        if (pathname === "/api/ai/diagnose" && method === "POST") return handleAiDiagnose(env, request);
        if (pathname === "/api/admin/plants/batch-create" && method === "POST") return handleBatchCreatePlants(env, request);
        if (pathname === "/api/admin/plants" && method === "POST") return handleCreatePlant(env, request);
        if (pathname === "/api/admin/recycle-bin" && method === "GET") return handleGetRecycleBin(env);
        const adminPlantMatch = pathname.match(new RegExp("^\\/api\\/admin\\/plants\\/(\\d+)$"));
        if (adminPlantMatch) {
          const pid = parseInt(adminPlantMatch[1]);
          if (method === "PUT") return handleUpdatePlant(env, request, pid);
          if (method === "DELETE") return handlePermanentDeletePlant(env, pid);
        }
        const adminPlantActionMatch = pathname.match(new RegExp("^\\/api\\/admin\\/plants\\/(\\d+)/(recycle|restore|reset|unclaim)$"));
        if (adminPlantActionMatch && method === "POST") {
          const pid = parseInt(adminPlantActionMatch[1]);
          const action = adminPlantActionMatch[2];
          if (action === "recycle") return handleRecyclePlant(env, pid);
          if (action === "restore") return handleRestorePlant(env, pid);
          if (action === "reset") return handleResetPlant(env, pid);
          if (action === "unclaim") return handleUnclaimPlant(env, pid);
        }
        if (pathname === "/api/admin/users" && method === "POST") return handleAdminCreateUser(env, request);
        const adminBanMatch = pathname.match(new RegExp("^\\/api\\/admin\\/users\\/([^/]+)/ban$"));
        if (adminBanMatch && method === "POST") return handleAdminBanUser(env, request, adminBanMatch[1]);
        const adminUserMatch = pathname.match(new RegExp("^\\/api\\/admin\\/users\\/([^/]+)$"));
        if (adminUserMatch && method === "PUT") return handleAdminUpdateUser(env, request, adminUserMatch[1]);
        if (adminUserMatch && method === "DELETE") return handleAdminDeleteUser(env, adminUserMatch[1]);
        if (pathname === "/api/admin/logs" && method === "POST") return handleAdminCreateLog(env, request);
        const adminLogMatch = pathname.match(new RegExp("^\\/api\\/admin\\/logs\\/([^/]+)$"));
        if (adminLogMatch) {
          const lid = adminLogMatch[1];
          if (method === "PUT") return handleAdminUpdateLog(env, request, lid);
          if (method === "DELETE") return handleAdminDeleteLog(env, lid);
        }
        return errorJson("API \u8DEF\u7531\u4E0D\u5B58\u5728", 404);
      } catch (e) {
        console.error("API Error:", e);
        return errorJson("\u670D\u52A1\u5668\u9519\u8BEF: " + (e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF"), 500);
      }
    }
    try {
      return env.ASSETS.fetch(request);
    } catch {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }
  }
};
export default index_default;
