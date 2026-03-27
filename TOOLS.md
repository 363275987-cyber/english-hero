# TOOLS.md - Local Notes

## 🚨 部署检查清单

每次部署后必须执行，确认线上真的更新了。

### 检查方法
1. `curl` 线上 index.html 获取 JS 文件名
2. 在 JS 文件中 grep 关键字（新功能标识符）确认代码已更新
3. 对比本地 build 产出的 JS 文件名，不一致 = 未部署成功

### 快速检查命令
```bash
# 1. 获取线上 JS 文件名
ONLINE_JS=$(curl -s https://363275987-cyber.github.io/english-hero/ | grep -o 'assets/index-[a-zA-Z0-9_-]*\.js')

# 2. 获取本地 build 的 JS 文件名
LOCAL_JS=$(ls /Users/wangmengnan/.openclaw-autoclaw/workspace/english-hero/dist/assets/index-*.js 2>/dev/null | head -1)

# 3. 对比
if [ "$ONLINE_JS" = "$LOCAL_JS" ]; then echo "✅ 已更新"; else echo "❌ 未更新！线上: $ONLINE_JS | 本地: $LOCAL_JS"; fi

# 4. 可选：grep 新功能关键词验证
curl -s "https://363275987-cyber.github.io/english-hero/assets/${ONLINE_JS#}" | grep -o '关键词'
```

### gh-pages 部署流程
项目用 gh-pages 分支部署，不是 GitHub Actions。
```bash
cd /Users/wangmengnan/.openclaw-autoclaw/workspace/english-hero
npx vite build
cd dist && rm -rf .git && git init && git add -A && git commit -m "deploy"
git remote add origin https://github.com/363275987-cyber/english-hero.git
git push -f origin HEAD:refs/heads/gh-pages
```

### 已知坑
- `dist/.git` 必须每次 `rm -rf` 再 `git init`，否则会残留旧 ref 导致 push 失败
- 老王设备可能缓存旧版本，需要硬刷新（Cmd+Shift+R）
- Feishu 发的链接如果不是直接打开而是复制粘贴，可能打开的是旧缓存

## Netlify 部署
- **CLI 路径**：`~/.npm-global/bin/netlify`（npm global install with --prefix）
- **认证状态**：已登录（team: 靓仔）
- **已部署项目**：todo-share → https://todo-share.netlify.app
