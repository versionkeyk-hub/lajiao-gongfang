#!/bin/bash
# ============================================================
#  只构建脚本 — 构建完成后打开 dist 文件夹和 Cloudflare 网站
#  你需要手动把 dist 文件夹拖到 Cloudflare 网页上
# ============================================================

cd "$(dirname "$0")"

# 颜色
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "============================================"
echo -e "${CYAN}  辣椒工坊 — 构建打包脚本${NC}"
echo "============================================"
echo ""

# ─── 检查 node ───
NODE_PATH=""
if [ -f "/Users/kejing/.workbuddy/binaries/node/versions/22.22.2/bin/node" ]; then
  NODE_PATH="/Users/kejing/.workbuddy/binaries/node/versions/22.22.2/bin"
elif command -v node &> /dev/null; then
  NODE_PATH="$(dirname $(which node))"
else
  echo -e "${RED}错误：找不到 Node.js${NC}"
  echo "请联系技术支持"
  read -p "按回车退出..."
  exit 1
fi

export PATH="$NODE_PATH:$PATH"

# ─── 清理旧的构建 ───
echo -e "${CYAN}━━━ 清理旧文件 ━━━${NC}"
rm -rf dist
echo -e "${GREEN}✓${NC} 已清理"

# ─── 安装依赖（如果需要）───
if [ ! -d "node_modules" ]; then
  echo ""
  echo -e "${CYAN}━━━ 安装依赖（首次需要，请耐心等待）━━━${NC}"
  npm install 2>&1 | tail -3
  echo -e "${GREEN}✓${NC} 依赖安装完成"
fi

# ─── 构建前端 + 后端 ───
echo ""
echo -e "${CYAN}━━━ 构建前端代码 ━━━${NC}"
npx vite build 2>&1 | tail -5
echo -e "${GREEN}✓${NC} 前端构建完成"

echo ""
echo -e "${CYAN}━━━ 打包后端 API ━━━${NC}"
npx esbuild worker.ts --bundle --format=esm --outfile=dist/_worker.js --target=es2022 --sourcemap 2>&1
echo -e "${GREEN}✓${NC} 后端打包完成"

# ─── 检查构建结果 ───
echo ""
echo -e "${CYAN}━━━ 检查构建结果 ━━━${NC}"
if [ -f "dist/_worker.js" ] && [ -f "dist/index.html" ]; then
  echo -e "${GREEN}✓ _worker.js（后端）已生成${NC}"
  echo -e "${GREEN}✓ index.html（前端）已生成${NC}"
else
  echo -e "${RED}✗ 构建失败！缺少关键文件${NC}"
  read -p "按回车退出..."
  exit 1
fi

# ─── 完成 ───
echo ""
echo "============================================"
echo -e "${GREEN}  ✅  构建完成！${NC}"
echo "============================================"
echo ""
echo "  接下来你需要手动上传到 Cloudflare："
echo ""
echo -e "  ${YELLOW}第 1 步：${NC}下面会自动打开 dist 文件夹"
echo -e "  ${YELLOW}第 2 步：${NC}下面会自动打开 Cloudflare 网站"
echo -e "  ${YELLOW}第 3 步：${NC}在 Cloudflare 网站上点「上传资产」"
echo -e "  ${YELLOW}第 4 步：${NC}把 dist 文件夹里的所有文件拖进去"
echo -e "  ${YELLOW}第 5 步：${NC}点「部署」，等 1 分钟就好了"
echo ""
echo -e "  ${CYAN}注意：是把 dist 文件夹「里面」的文件拖进去，${NC}"
echo -e "  ${CYAN}不是把 dist 文件夹本身拖进去${NC}"
echo ""

read -p "按回车打开 dist 文件夹和 Cloudflare 网站..."

# 打开 dist 文件夹
open dist

# 打开 Cloudflare Pages 部署页面
open "https://dash.cloudflare.com/?to=/:account/pages/view/lajiao-gongfang/deployments"

echo ""
echo -e "${GREEN}已打开！按 Cloudflare 网站上的提示操作即可${NC}"
echo ""
read -p "操作完成后按回车退出..."
