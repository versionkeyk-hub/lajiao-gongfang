/**
 * 自动补丁脚本 — 在构建前自动修复 api.ts
 * 
 * AI Studio 下载的代码有旧的 API 地址（指向 Google Cloud Run），
 * 这个脚本会自动把它改成 Cloudflare 同域路径。
 * 不需要手动改代码，Cloudflare 构建时自动执行。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';

const API_FILE = 'src/lib/api.ts';

if (!existsSync(API_FILE)) {
  console.log('[patch] src/lib/api.ts not found, skipping');
  process.exit(0);
}

let content = readFileSync(API_FILE, 'utf-8');
let changed = false;

// 1. 删除 CLOUD_RUN_BACKEND 常量
if (content.includes('CLOUD_RUN_BACKEND')) {
  // 移除整个 CLOUD_RUN_BACKEND 行
  content = content.replace(
    /const\s+CLOUD_RUN_BACKEND\s*=\s*['"][^'"]*['"];?\s*\n?/g,
    ''
  );
  changed = true;
  console.log('[patch] Removed CLOUD_RUN_BACKEND constant');
}

// 2. 修复 getUrl 函数 — 用简洁的同域相对路径版本替换
const oldGetUrlPattern = /function\s+getUrl\s*\([^)]*\)\s*:?\s*string\s*\{[\s\S]*?\n\}/;
if (oldGetUrlPattern.test(content) && content.includes('run.app')) {
  content = content.replace(oldGetUrlPattern, 
`function getUrl(url: string): string {
  if (url.startsWith('/')) {
    if (VITE_API_BASE) {
      return \`\${VITE_API_BASE}\${url}\`;
    }
    return url;
  }
  return url;
}`);
  changed = true;
  console.log('[patch] Fixed getUrl() to use relative paths');
}

// 3. 如果还有 run.app 引用，全部清除
if (content.includes('run.app')) {
  content = content.replace(/['"]https?:\/\/[^'"]*run\.app[^'"]*['"]/g, "''");
  changed = true;
  console.log('[patch] Removed remaining run.app references');
}

// 4. 提高超时时间从 3000 到 8000
if (content.includes('timeoutMs = 3000') || content.includes('timeoutMs=3000')) {
  content = content.replace(/timeoutMs\s*=\s*3000/g, 'timeoutMs = 8000');
  changed = true;
  console.log('[patch] Increased timeout from 3000ms to 8000ms');
}

// 5. 移除对 pages.dev / cloudflare 的特殊跳转逻辑
if (content.includes("pages.dev") || content.includes("cloudflare")) {
  // 移除检查 hostname 的逻辑块
  const hostCheckPattern = /if\s*\(typeof\s+window[^}]*pages\.dev[^}]*\}/s;
  if (hostCheckPattern.test(content)) {
    content = content.replace(hostCheckPattern, '');
    changed = true;
    console.log('[patch] Removed hostname-based redirect logic');
  }
}

if (changed) {
  writeFileSync(API_FILE, content, 'utf-8');
  console.log('[patch] ✓ api.ts patched successfully');
} else {
  console.log('[patch] api.ts already patched, no changes needed');
}
