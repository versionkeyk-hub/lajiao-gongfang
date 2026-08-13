#!/bin/bash
# ╔══════════════════════════════════════════════════════════╗
# ║     辣椒工坊 — 从 AI Studio 下载包一键部署脚本             ║
# ║                                                          ║
# ║   使用方法：                                              ║
# ║   1. 在 Google AI Studio 改完代码，下载 zip               ║
# ║   2. 双击此文件                                           ║
# ║   3. 脚本自动找到下载的 zip，打补丁，部署到 Cloudflare    ║
# ║                                                          ║
# ╚══════════════════════════════════════════════════════════╝

set -e

# 出错时显示错误信息，而不是直接退出
trap 'echo ""; echo -e "\033[0;31m❌ 部署出错！请截图这段错误信息。错误发生在第 $LINENO 行\033[0m"; read -p "按回车键退出..."' ERR

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "============================================"
echo "  🌶️  辣椒工坊 — AI Studio 下载包部署"
echo "============================================"
echo ""

# 项目目录（脚本所在目录）
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ─── 检查 Node.js ───
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js，请先安装：${NC}"
    echo -e "   下载地址: https://nodejs.org (选 LTS 版本)"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

# ─── 查找下载的 zip 文件 ───
# 搜索多个可能的下载目录（iCloud Edge下载、标准下载文件夹等）
SEARCH_DIRS=(
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs/惠民皓天/Edge下载"
    "$HOME/Downloads"
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs/惠民皓天/Edge下载"
)

# 动态查找 iCloud 中所有 "Edge下载" 目录（路径可能有变化）
ICLOUD_BASE="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
if [ -d "$ICLOUD_BASE" ]; then
    while IFS= read -r -d '' edge_dir; do
        # 避免重复添加
        already_added=false
        for d in "${SEARCH_DIRS[@]}"; do
            if [ "$d" == "$edge_dir" ]; then
                already_added=true
                break
            fi
        done
        if [ "$already_added" == "false" ]; then
            SEARCH_DIRS+=("$edge_dir")
        fi
    done < <(find "$ICLOUD_BASE" -maxdepth 3 -type d -name "*Edge下载*" -print0 2>/dev/null)
fi

echo -e "${CYAN}正在查找下载的代码包...${NC}"
echo ""

# 在所有搜索目录中找最近的包含"辣椒"的 zip 文件
# 注意：不用 ls | for（空格会拆断文件名），改用 glob + 按时间比较
ZIP_FILE=""
ZIP_TIME_NEWEST=0
for dir in "${SEARCH_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        for f in "$dir"/*辣椒*.zip; do
            [ -f "$f" ] || continue
            # 获取文件修改时间戳（秒）
            f_epoch=$(stat -f "%m" "$f" 2>/dev/null || echo 0)
            if [ "$f_epoch" -gt "$ZIP_TIME_NEWEST" ]; then
                ZIP_TIME_NEWEST=$f_epoch
                ZIP_FILE="$f"
            fi
        done
    fi
done

# 如果没找到带"辣椒"的，找最近的所有 zip
if [ -z "$ZIP_FILE" ]; then
    for dir in "${SEARCH_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            for f in "$dir"/*.zip; do
                [ -f "$f" ] || continue
                f_epoch=$(stat -f "%m" "$f" 2>/dev/null || echo 0)
                if [ "$f_epoch" -gt "$ZIP_TIME_NEWEST" ]; then
                    ZIP_TIME_NEWEST=$f_epoch
                    ZIP_FILE="$f"
                fi
            done
        fi
    done
fi

if [ -n "$ZIP_FILE" ]; then
    ZIP_NAME=$(basename "$ZIP_FILE")
    # 获取文件修改时间
    ZIP_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$ZIP_FILE" 2>/dev/null || echo "未知")
    echo -e "${GREEN}✓${NC} 找到代码包："
    echo -e "  文件名: ${YELLOW}$ZIP_NAME${NC}"
    echo -e "  修改时间: $ZIP_TIME"
    echo ""
    echo -e "${YELLOW}这是你刚下载的代码包吗？${NC}"
    echo "  [1] 是，就用这个部署"
    echo "  [2] 不是，我要手动指定文件"
    echo "  [3] 不用 zip，直接重新部署当前代码"
    echo ""
    read -p "请选择 (1/2/3): " choice

    if [ "$choice" == "2" ]; then
        echo ""
        echo -e "${CYAN}请把 zip 文件拖到这里，然后按回车：${NC}"
        read -r drag_file
        # 去掉可能的引号和反斜杠
        ZIP_FILE=$(echo "$drag_file" | sed 's/\\//g' | tr -d '"' | tr -d "'")
        if [ ! -f "$ZIP_FILE" ]; then
            echo -e "${RED}❌ 文件不存在: $ZIP_FILE${NC}"
            read -p "按回车键退出..."
            exit 1
        fi
        ZIP_NAME=$(basename "$ZIP_FILE")
    elif [ "$choice" == "3" ]; then
        ZIP_FILE=""
        ZIP_NAME=""
    fi
else
    echo -e "${YELLOW}未在下载文件夹找到 zip 文件${NC}"
    echo ""
    echo -e "${CYAN}请把下载的 zip 文件拖到这里，然后按回车：${NC}"
    echo -e "  (或者输入 3 跳过，直接部署当前代码)"
    read -r drag_file
    if [ "$drag_file" == "3" ]; then
        ZIP_FILE=""
        ZIP_NAME=""
    else
        ZIP_FILE=$(echo "$drag_file" | sed 's/\\//g' | tr -d '"' | tr -d "'")
        if [ ! -f "$ZIP_FILE" ]; then
            echo -e "${RED}❌ 文件不存在: $ZIP_FILE${NC}"
            read -p "按回车键退出..."
            exit 1
        fi
        ZIP_NAME=$(basename "$ZIP_FILE")
    fi
fi

# ─── 如果有 zip 文件，解压并替换代码 ───
if [ -n "$ZIP_FILE" ]; then
    echo ""
    echo -e "${CYAN}━━━ 第 1 步：备份 Cloudflare 专用文件 ━━━${NC}"

    # 备份 Cloudflare 专用文件（AI Studio 下载包里没有这些）
    BACKUP_DIR="$PROJECT_DIR/.cloudflare-backup"
    mkdir -p "$BACKUP_DIR"
    cp "$PROJECT_DIR/worker.ts" "$BACKUP_DIR/" 2>/dev/null && echo -e "${GREEN}✓${NC} 已备份 worker.ts" || echo -e "${YELLOW}!${NC} worker.ts 不存在"
    cp "$PROJECT_DIR/wrangler.toml" "$BACKUP_DIR/" 2>/dev/null && echo -e "${GREEN}✓${NC} 已备份 wrangler.toml" || echo -e "${YELLOW}!${NC} wrangler.toml 不存在"
    cp "$PROJECT_DIR/更新部署.command" "$BACKUP_DIR/" 2>/dev/null
    cp "$PROJECT_DIR/AI-Studio部署.command" "$BACKUP_DIR/" 2>/dev/null

    echo ""
    echo -e "${CYAN}━━━ 第 2 步：解压新代码 ━━━${NC}"
    echo -e "  正在解压 ${YELLOW}$ZIP_NAME${NC}"

    # 解压到临时目录
    TEMP_DIR=$(mktemp -d)
    unzip -o -q "$ZIP_FILE" -d "$TEMP_DIR"

    # 如果解压出来是个子目录，进入子目录
    EXTRACTED_DIR="$TEMP_DIR"
    SUBDIR_COUNT=$(ls -d "$TEMP_DIR"/*/ 2>/dev/null | wc -l)
    if [ "$SUBDIR_COUNT" == "1" ] && [ ! -f "$TEMP_DIR/package.json" ]; then
        EXTRACTED_DIR=$(ls -d "$TEMP_DIR"/*/)
    fi

    echo -e "${GREEN}✓${NC} 解压完成"

    echo ""
    echo -e "${CYAN}━━━ 第 3 步：替换项目文件 ━━━${NC}"

    # 复制新代码到项目目录（保留 .git, node_modules, .cloudflare-backup, dist）
    # 先删除旧的源码目录（保留 node_modules 和配置）
    rm -rf "$PROJECT_DIR/src"
    rm -rf "$PROJECT_DIR/public"
    rm -f "$PROJECT_DIR/index.html"
    rm -f "$PROJECT_DIR/package.json"
    rm -f "$PROJECT_DIR/package-lock.json"
    rm -f "$PROJECT_DIR/bun.lock"
    rm -f "$PROJECT_DIR/tsconfig.json"
    rm -f "$PROJECT_DIR/vite.config.ts"
    rm -f "$PROJECT_DIR/server.ts"
    rm -f "$PROJECT_DIR/metadata.json"
    rm -f "$PROJECT_DIR/.env.example"
    rm -f "$PROJECT_DIR/.gitignore"

    # 复制新文件
    cp -R "$EXTRACTED_DIR/src" "$PROJECT_DIR/" 2>/dev/null || echo -e "${YELLOW}!${NC} 无 src 目录"
    cp -R "$EXTRACTED_DIR/public" "$PROJECT_DIR/" 2>/dev/null || echo -e "${YELLOW}!${NC} 无 public 目录"
    cp "$EXTRACTED_DIR/index.html" "$PROJECT_DIR/" 2>/dev/null || echo -e "${YELLOW}!${NC} 无 index.html"
    cp "$EXTRACTED_DIR/package.json" "$PROJECT_DIR/" 2>/dev/null || echo -e "${YELLOW}!${NC} 无 package.json"
    cp "$EXTRACTED_DIR/tsconfig.json" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/vite.config.ts" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/server.ts" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/metadata.json" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/.env.example" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/.gitignore" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$EXTRACTED_DIR/bun.lock" "$PROJECT_DIR/" 2>/dev/null || true

    # 清理临时目录
    rm -rf "$TEMP_DIR"

    echo -e "${GREEN}✓${NC} 代码已替换"

    echo ""
    echo -e "${CYAN}━━━ 第 4 步：恢复 Cloudflare 专用文件 ━━━${NC}"

    # 恢复 Cloudflare 专用文件
    cp "$BACKUP_DIR/worker.ts" "$PROJECT_DIR/" 2>/dev/null && echo -e "${GREEN}✓${NC} 已恢复 worker.ts"
    cp "$BACKUP_DIR/wrangler.toml" "$PROJECT_DIR/" 2>/dev/null && echo -e "${GREEN}✓${NC} 已恢复 wrangler.toml"
    cp "$BACKUP_DIR/更新部署.command" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$BACKUP_DIR/AI-Studio部署.command" "$PROJECT_DIR/" 2>/dev/null || true

    echo ""
    echo -e "${CYAN}━━━ 第 5 步：修补前端 API（移除旧的后端地址） ━━━${NC}"

    # 用 Python 修补 api.ts — 移除 CLOUD_RUN_BACKEND 和旧的 getUrl 逻辑
    /usr/bin/python3 << 'PATCH_SCRIPT'
import re, os

api_path = "src/lib/api.ts"
if not os.path.exists(api_path):
    print("!  src/lib/api.ts 不存在，跳过补丁")
    exit(0)

with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

changed = False

# 1. 移除 CLOUD_RUN_BACKEND 常量定义
pattern1 = r"const\s+CLOUD_RUN_BACKEND\s*=\s*['\"].*?['\"];?\s*\n?"
if re.search(pattern1, content):
    content = re.sub(pattern1, "", content)
    changed = True
    print("✓  已移除 CLOUD_RUN_BACKEND 旧地址")

# 2. 替换 getUrl 函数（处理多种可能的格式）
# 匹配从 "function getUrl" 到下一个 "function " 之前的内容
pattern2 = r"function\s+getUrl\s*\([^)]*\)\s*:\s*string\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}"
if re.search(pattern2, content):
    new_geturl = """function getUrl(url: string): string {
  if (url.startsWith('/')) {
    if (VITE_API_BASE) {
      return `${VITE_API_BASE}${url}`;
    }
    return url;
  }
  return url;
}"""
    content = re.sub(pattern2, new_geturl, content)
    changed = True
    print("✓  已修复 getUrl 函数（使用同域相对路径）")

# 3. 确保超时时间为 8 秒
pattern3 = r"timeoutMs\s*=\s*\d+"
if re.search(pattern3, content):
    content = re.sub(r"timeoutMs\s*=\s*3000", "timeoutMs = 8000", content)
    if "timeoutMs = 8000" in content:
        changed = True
        print("✓  已将超时时间从 3 秒提高到 8 秒")

if changed:
    with open(api_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓  api.ts 补丁完成")
else:
    print("✓  api.ts 无需修补（已经是最新）")

PATCH_SCRIPT

    # 确保必要的依赖存在（hono, wrangler）
    echo ""
    echo -e "${CYAN}━━━ 第 6 步：检查依赖 ━━━${NC}"

    # 检查 package.json 是否有 hono 和 wrangler
    NEEDS_INSTALL=false
    if ! grep -q '"hono"' package.json 2>/dev/null; then
        echo -e "${YELLOW}  安装 hono（后端框架）...${NC}"
        npm install hono --save-dev 2>&1 | tail -2
        NEEDS_INSTALL=true
    else
        echo -e "${GREEN}✓${NC} hono 已在依赖中"
    fi

    if ! grep -q '"wrangler"' package.json 2>/dev/null; then
        echo -e "${YELLOW}  安装 wrangler（部署工具）...${NC}"
        npm install wrangler --save-dev 2>&1 | tail -2
        NEEDS_INSTALL=true
    else
        echo -e "${GREEN}✓${NC} wrangler 已在依赖中"
    fi

    # 安装所有依赖（新代码可能有新依赖）
    echo -e "${CYAN}  安装全部依赖...${NC}"
    npm install 2>&1 | tail -3
    echo -e "${GREEN}✓${NC} 依赖安装完成"

else
    echo ""
    echo -e "${CYAN}━━━ 直接部署当前代码 ━━━${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  安装依赖...${NC}"
        npm install 2>&1 | tail -3
    fi
fi

# ─── 同步代码到 GitHub ───
echo ""
echo -e "${CYAN}━━━ 同步代码到 GitHub ━━━${NC}"
GH_TOKEN="$(grep GH_TOKEN .cloudflare.env 2>/dev/null | cut -d'"' -f2)"
if [ -z "$GH_TOKEN" ]; then
    echo -e "${YELLOW}  跳过 GitHub 同步（.cloudflare.env 中没有 GH_TOKEN）${NC}"
else
    /usr/bin/python3 << 'GITHUB_SYNC'
import os, json, base64, urllib.request, urllib.parse

token = os.popen("grep GH_TOKEN .cloudflare.env | cut -d'\"' -f2").read().strip()
owner = "versionkeyk-hub"
repo = "lajiao-gongfang"
api = "https://api.github.com"

def api_call(url, method="GET", data=None):
    headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json"
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

import pathlib
skip = {"node_modules", "dist", ".git", ".workbuddy", ".cloudflare-backup"}
files = []
for root, dirs, fnames in os.walk("."):
    dirs[:] = [d for d in dirs if d not in skip and not d.startswith(".")]
    for f in fnames:
        if f == ".cloudflare.env":
            continue
        fp = os.path.join(root, f)
        rel = os.path.relpath(fp, ".").replace("\\", "/")
        files.append(rel)

count = 0
for f in files:
    content = open(f, "rb").read()
    b64 = base64.b64encode(content).decode()
    # Check if file exists
    existing = api_call(f"{api}/repos/{owner}/{repo}/contents/{urllib.parse.quote(f)}")
    sha = existing.get("sha") if "sha" in existing else None
    payload = {"message": f"Update {f}", "content": b64}
    if sha:
        payload["sha"] = sha
    result = api_call(f"{api}/repos/{owner}/{repo}/contents/{urllib.parse.quote(f)}", "PUT", payload)
    if result.get("commit"):
        count += 1
    else:
        # Try creating new
        result2 = api_call(f"{api}/repos/{owner}/{repo}/contents/{urllib.parse.quote(f)}", "PUT", {"message": f"Add {f}", "content": b64})
        if result2.get("commit"):
            count += 1

print(f"  GitHub: {count}/{len(files)} files synced")
GITHUB_SYNC
    echo -e "${GREEN}✓${NC} GitHub 同步完成"
fi

# ─── 构建前端 + 打包后端 ───
echo ""
echo -e "${CYAN}━━━ 清理旧构建 ━━━${NC}"
rm -rf dist
echo -e "${GREEN}✓${NC} 已清理"

echo ""
echo -e "${CYAN}━━━ 构建前端代码 ━━━${NC}"
npx vite build 2>&1 | tail -5
echo -e "${GREEN}✓${NC} 前端构建完成"

echo ""
echo -e "${CYAN}━━━ 打包后端 Worker ━━━${NC}"
npx esbuild worker.ts --bundle --format=esm --outfile=dist/_worker.js --target=es2022 --sourcemap 2>&1
echo -e "${GREEN}✓${NC} 后端打包完成"

# ─── 部署到 Cloudflare Pages ───
echo ""
echo -e "${CYAN}━━━ 部署到 Cloudflare Pages ━━━${NC}"
export CLOUDFLARE_API_TOKEN="$(grep CLOUDFLARE_API_TOKEN .cloudflare.env | cut -d'"' -f2)"
export CLOUDFLARE_ACCOUNT_ID="$(grep CLOUDFLARE_ACCOUNT_ID .cloudflare.env | cut -d'"' -f2)"
npx wrangler pages deploy dist --project-name lajiao-gongfang 2>&1 | tail -8

echo ""
echo "============================================"
echo -e "${GREEN}  ✅  部署成功！${NC}"
echo "============================================"
echo ""
echo "  🌐 线上地址："
echo "  https://lajiao-gongfang.pages.dev"
echo "  📦 GitHub 仓库："
echo "  https://github.com/versionkeyk-hub/lajiao-gongfang"
echo ""
echo -e "  ${YELLOW}提示：浏览器里按 Cmd+Shift+R 强制刷新${NC}"
echo ""

read -p "按回车键打开浏览器查看..."
open "https://lajiao-gongfang.pages.dev"
