#!/bin/bash
# ╔══════════════════════════════════════════════════════╗
# ║          辣椒工坊 — 一键更新脚本                      ║
# ║                                                       ║
# ║   用法：双击此文件运行，或在终端执行：                 ║
# ║   bash 更新部署.command                               ║
# ║                                                       ║
# ║   脚本会自动完成：                                     ║
# ║     1. 构建最新前端代码                                ║
# ║     2. 部署到 Cloudflare                              ║
# ║     3. 打开浏览器查看结果                              ║
# ╚══════════════════════════════════════════════════════╝

set -e

# ─── 颜色 ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "    🌶️  辣椒工坊 — 一键更新部署"
echo "============================================"
echo ""

# ─── 定位项目目录 ───
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ─── 检查 Node.js ───
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js，请先安装：${NC}"
    echo -e "   下载地址: https://nodejs.org (选 LTS 版本)"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js 版本: $NODE_VERSION"

# ─── 检查依赖是否安装 ───
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 首次运行，正在安装依赖（需要1-2分钟）...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} 依赖安装完成"
else
    echo -e "${GREEN}✓${NC} 依赖已就绪"
fi

# ─── 第 1 步：清理旧构建 + 构建前端 + 打包后端 ───
echo ""
echo -e "${CYAN}━━━ 第 0 步：清理旧构建 ━━━${NC}"
rm -rf dist
echo -e "${GREEN}✓${NC} 已清理"

echo ""
echo -e "${CYAN}━━━ 第 1 步：构建前端代码 ━━━${NC}"
npx vite build 2>&1 | tail -5
echo -e "${GREEN}✓${NC} 前端构建完成"

echo ""
echo -e "${CYAN}━━━ 第 1.5 步：打包后端 Worker ━━━${NC}"
npx esbuild worker.ts --bundle --format=esm --outfile=dist/_worker.js --target=es2022 --sourcemap 2>&1
echo -e "${GREEN}✓${NC} 后端打包完成"

# ─── 第 2 步：部署到 Cloudflare Pages ───
echo ""
echo -e "${CYAN}━━━ 第 2 步：部署到 Cloudflare Pages ━━━${NC}"
export CLOUDFLARE_API_TOKEN="$(grep CLOUDFLARE_API_TOKEN .cloudflare.env | cut -d'"' -f2)"
export CLOUDFLARE_ACCOUNT_ID="$(grep CLOUDFLARE_ACCOUNT_ID .cloudflare.env | cut -d'"' -f2)"
npx wrangler pages deploy dist --project-name lajiao-gongfang 2>&1 | tail -8

echo ""
echo "============================================"
echo -e "${GREEN}  ✅  更新成功！${NC}"
echo "============================================"
echo ""
echo "  🌐 线上地址："
echo "  https://lajiao-gongfang.pages.dev"
echo ""

# ─── 打开浏览器 ───
read -p "按回车键打开浏览器查看，或按 Ctrl+C 退出..."
open "https://lajiao-gongfang.pages.dev"
