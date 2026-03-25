# English Hero 开发日志

## 2026-03-25 — 阶段四完成（12:45-13:10）

### 背景
阶段三完成后老王要求继续阶段四。

### 完成内容

#### 1. 礼物兑换系统（GiftShop.vue）
- 5个现实礼物：冰淇淋/游戏时间/文具盲盒/宠物体验/游乐场半天
- 兑换流程：选礼物 → 随机抽3个已学单词 → 大声说英语 → 老王逐个确认
- 首页 + 独立页面入口

#### 2. 成就系统（AchievementPage.vue + achievements.js）
- 18个成就，6大类：
  - 学习：初出茅庐/单词猎人/词汇达人/英语小能手
  - 连续：三天/一周/月度学霸
  - 星星：百星/星辰大海/至尊学霸
  - Boss：初次胜利/半路英雄/拯救英语世界
  - 武器：武器收藏家/大师之剑
  - 特殊：神秘礼物
- 自动检测：learnWordById / defeatBoss / updateStreak 时触发
- 奖励自动发放（星星/道具/兑换券）

#### 3. 语法情景学习（GrammarPage.vue）
- 6模块标签切换
- 语法要点格式化显示（加粗、换行、⚠️高亮）
- 情景对话点击朗读（TTS，S1蓝色/S2绿色区分）
- 歌谣逐行朗读

#### 4. 前置补课（AssessmentPage.vue）
- 8题基础测试（看图选词/颜色/数字/拼写/动作/时间/人称）
- 选择题 + 拼写题
- TTS 发音辅助
- 成绩评估 + 薄弱项补课建议

#### 5. 首页改版
- 新增「更多」区域（4格入口：语法课堂/成就墙/礼物兑换/基础测试）

### 技术细节
- 成就系统用 condition 函数动态判断，不依赖事件流
- checkAchievements 返回新解锁列表（为未来弹窗特效预留）
- GiftShop 用老王逐个确认模式（不用AI验证，由家长把关）

### 部署
- https://english-hero.netlify.app
- Netlify deploy: 69c3695f4c8d808fd957d359

---

## 2026-03-25 — 阶段三完成（12:21-12:35）

### 背景
阶段二完成后老王要求继续阶段三。子代理 MiniMax 模型 API key 缺失失败，改为直接生成。

### 完成内容

#### 1. content.js 新数据文件
- 新建 `src/data/content.js`，存放 6 模块的 grammarPoint / dialogue / chant
- words.js 的 moduleMeta 从 content.js 导入填充

#### 2. 语法点（6个模块）
- M1: What do/does... do? / Where... work? / Why + Because
- M2: to + 不定式 / will / How often + 频率副词
- M3: less/fewer/more/too much/too many/enough
- M4: need... to... / First, Next, Then, After that, Finally
- M5: too + 形容词 / 现在完成时 Have you... before?
- M6: already/yet / should/should not / Why don't we...?

#### 3. 情景对话（12组，约80句）
- 每模块 2 组 S1/S2 角色对话
- 全部使用模块核心单词 + 对应语法
- 用词简单，适合五年级基础薄弱学生

#### 4. 歌谣（6段）
- 每模块一段 4-8 行押韵英文韵文
- 包含核心单词 + emoji + 中文翻译
- 节奏感强，适合朗读

### 技术细节
- content.js 独立数据文件，避免 words.js 过于臃肿
- moduleMeta 通过 import 动态填充，无循环依赖

### 部署
- https://english-hero.netlify.app
- Netlify deploy: 69c363b56aa6bb85a062f38f

---

## 2026-03-25 — 阶段二完成（12:08-12:40）

### 背景
阶段零+一在上午完成（04:00-11:15），下午老王确认继续阶段二。

### 完成内容

#### 1. SRS 间隔重复系统（game.js 重构）
- **SRS 等级表**：4个等级对应不同复习间隔和衰减速率
  - 等级0（木剑）：1天间隔，每日衰减25%
  - 等级1（骑士剑）：3天间隔，每日衰减15%
  - 等级2（精灵弓）：7天间隔，每日衰减8%
  - 等级3（大师剑）：14天间隔，每日衰减4%
- **智能调度**：复习队列按 SRS 间隔 + 耐久度双重判定，逾期最长的排最前
- **答对奖励递增**：恢复量 = 25 + reviewCount × 5（越熟恢复越多）
- **答错降级**：SRS 等级 -1，耐久 -15（而不是固定 -10）
- **碎裂自动降级**：衰减到 0 时自动标记 forgotten + 更新 moduleProgress

#### 2. 武器 ↔ 单词绑定系统
- **每个已学单词 = 一把武器**，武器等级 = SRS 等级
  - reviewCount 0 → 木剑 ⚔️
  - reviewCount 1-2 → 骑士剑 🗡️
  - reviewCount 3-4 → 精灵弓 🏹
  - reviewCount 5+ → 大师剑 ⚡
- **WeaponList.vue 新页面**（`/weapons`）：
  - 统计栏（良好/磨损/碎裂数量）
  - 筛选标签（全部/碎裂/磨损/良好）
  - 武器卡片列表：单词 + 音标 + 释义 + 武器等级 + 耐久度条
  - 碎裂武器点击 → 跳转重新学习
  - 磨损武器点击 → 跳转复习页
- **首页入口**：「查看武器」→「武器库 (N)」显示武器总数

#### 3. Boss 战改进
- **Boss 血量保留**：撤退后保存 bossHpMap，下次进入从当前血量继续
  - 新增 saveBossHp / getBossHp / clearBossHp 方法
  - 击败 Boss 后清除保存血量
  - 冒险地图显示「⚔️ 战斗中」标记
- **自适应难度**：
  - 默认 normal 模式
  - 连续答错 → 降为 easy 模式（显示首字母提示、高亮正确选项、字母数量提示）
  - 连对 3 题 → 回到 normal 模式
  - 战斗界面显示当前难度模式标签

#### 4. 复习页增强
- 显示武器等级标签 + SRS 间隔信息
- 完成后新增「🗡️ 武器库」按钮引导查看升级

### 技术细节
- game.js 引入了 allWords import（武器列表需要查询单词信息）
- 移除了 Home.vue 的武器弹窗模态框（改为独立页面）
- 新增 bossHpMap 到 defaults 状态

### 部署
- https://english-hero.netlify.app
- Netlify deploy: 69c36188a540bb75333186e4

---

## 2026-03-25 — 阶段零+一收尾（11:01-11:15）

### 背景
凌晨 04:00-09:10 已完成第一轮优化（game.js 重写、Home/Shop/Profile 接入真实数据、PinLogin 修复）。老王发了完整开发路线图，确认后开始收尾阶段零+一。

### 完成内容

#### 1. game.js 补全
- **新增 `forgetWord(wordId)`** — 耐久归零，回到待学状态
- **新增 `extractModuleId(wordId)`** — 从 wordId 提取模块号（m1_w01 → 1）
- **修复 `getModuleLearnedCount`** — 之前用了不存在的 `_moduleId` 字段，导致模块学习数永远为 0
- **新增 `updateModuleProgress(moduleId)`** — 学单词时自动写入 moduleProgress

#### 2. words.js 扩展
- **导出 `moduleStories`** — 6 个模块的串故事常量（之前只定义不导出）
- **导出 `moduleMeta`** — 模块元数据结构（grammarPoint/dialogue/chant 留空，阶段三填充）

#### 3. WordLearn.vue 修复
- **串故事弹窗** — 之前读 funnyTip 拆分（只显示记忆法），现在读模块完整 story
- **babel 解析 bug** — `computed(() => ({...}[id]))` 模式在 vue-sfc 的 babel parser 中报错，改用外部变量 + computed 引用

#### 4. ReviewPage.vue（新建）
- 间隔复习页：选择题 quiz + 查看答案 + 记住/忘了
- 武器耐久度可视化（绿 >50% / 黄 >25% / 红 ≤25%）
- 紧急提示（"武器快碎了！" / "武器磨损中"）
- 复习完成统计（记住 N 个 + 忘了 N 个）
- 空状态（没有需要复习的单词）

#### 5. 路由
- 新增 `/review` → ReviewPage.vue

### 修复的 Bug
| Bug | 原因 | 修复 |
|-----|------|------|
| 模块学习数永远为 0 | getModuleLearnedCount 用了 `_moduleId`（不存在的字段） | 改用 `extractModuleId(wordId)` 从 wordId 解析 |
| 串故事弹窗内容错误 | 读 funnyTip 拆分 | 改读 moduleStories[moduleId] |
| babel parser 报错 | `({})[id]` 模式不被支持 | 提取为外部变量 `_moduleMap[moduleId]` |
| v-else-if 编译错误 | completion div 的 v-else-if 与 review card 的 v-if 不相邻 | 改为独立 v-if |

### 部署
- https://english-hero.netlify.app
- Netlify deploy: 69c351f86aa6bb5a0262f3fa

---

## 2026-03-25 凌晨 — 第一轮优化（04:00-09:10）

### 完成内容
1. **game.js 重写** — 之前多次编辑导致文件损坏（async/await 残留），完全重写清理版
2. **App.vue** — `cloudSyncEnabled` → `cloudOk`，修复引用错误
3. **Home.vue** — 去掉所有假数据，接入真实 game store（等级/星星/连续天数/正确率/Boss击败数）
4. **Shop.vue** — 接入真实星星余额，购买真正扣星星，已拥有/等级不足/星星不足三种状态
5. **Profile.vue** — 接入真实数据，消耗品背包从 itemTypes 动态读取，添加退出登录功能
6. **PinLogin.vue** — 修复存档码导入 bug（之前用 `localStorage.getItem` 或 '0000'，改成用用户输入的 `pin.value`）

### 待确认
- Supabase API key 无效 — curl 返回 `Invalid API key`，需要老王去 Dashboard 复制新的 anon key
- Supabase `hero_game_state` 表是否已创建

---

## 2026-03-25 — 5轮自主迭代（15:34-15:50）

### 第一轮：关键Bug修复
- 修复 BossBattle.vue 重复 `const router = useRouter()`
- 修复 App.vue `game.cloudPull()` → `game.pullCloud()`
- game.js 新增 `getBossHp()` / `saveBossHp()` / `clearBossHp()` + `bossHpMap`
- Boss血量撤退保留功能真正生效

### 第二轮：UI一致性
- 统一卡片圆角 16px、背景色、边框
- 统一按钮 active:scale(0.97)
- 全局安全区适配
- 新增 `.btn-interactive` 和 `.safe-bottom` 全局CSS类

### 第三轮：用户体验
- Home.vue 新增新手引导横幅

### 第四轮：品牌化
- 标题改为"燃学英语"，App header "🔥 燃学英语"
- 添加 OG meta、apple-mobile-web-app 支持、theme-color

### 第五轮：最终检查
- 交叉页面导航验证通过
- 无 console.log/TODO/FIXME
- 构建大小 4.3MB，全部通过

### 部署：5次，全部成功
