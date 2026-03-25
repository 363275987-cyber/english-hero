# English Hero 开发路线图

> 创建日期：2026-03-25
> 状态：阶段零+一已完成 ✅ | 阶段二待开始 ⏳

---

## 阶段零：数据层重构（基础设施）✅ 已完成

**为什么先做：** 后面所有功能都依赖数据结构，现在改了后面不用反复改。

### 改动清单
- [x] words.js 每个单词扩展字段（funImage/funSentence/storySegment/memoryHint — funImage/funSentence/funnyTip 已有）
- [x] 每个模块增加字段（story/grammarPoint/dialogue/chant — story 已有，其余留空结构）
- [x] game.js state 扩展（wordProgress/moduleProgress/reviewQueue/todayLearned）
- [x] game.js 新增方法（learnWord/reviewWord/forgetWord/decayAllDurability/getReviewQueue）

---

## 阶段一：核心学习闭环 ⭐ ✅ 已完成

**目标：** 形成"学→练→战→奖"闭环，App 从"答题游戏"变成"学习产品"。

### 1.1 单词学习页（WordLearn.vue）✅
- 路由：`/learn/:moduleId`
- 大图配图 + 音标 + TTS 听发音
- 记忆法 + 趣味例句 + "我来编一个"自定义记忆法
- 学会→自动跳下一个未学→全学完弹出串故事→解锁Boss

### 1.2 模块串故事弹窗 ✅
- 全学完所有单词后弹出
- 显示模块完整搞笑故事
- "开始Boss战"按钮 + "稍后再说"

### 1.3 学习路径改造（Adventure.vue）✅
- 点模块 → 检查是否学完单词
- 没学完 → 进入学习页
- 已学完 → 进入Boss战
- 显示"未学习/可挑战/已通关"状态

### 1.4 首页改造（Home.vue）✅
- 快捷入口：冒险地图 / 继续学习 / 复习单词 / 查看武器
- 等级进度条 + 今日任务
- 学习统计（连续天数/掌握单词/正确率）

### 1.5 复习页（ReviewPage.vue）✅
- 路由：`/review`
- 间隔重复队列：耐久度 <50% 的单词
- 选择题 quiz + 查看答案 + 记住/忘了
- 武器耐久度可视化 + 紧急提示

---

## 阶段二：间隔重复 + 武器耐久度 ✅ 已完成

**目标：** 让学过的单词不会忘，把"耐久度=记忆"的塞尔达机制真正跑起来。

### 2.1 间隔重复系统 ✅
- [x] 遗忘曲线细化（4级SRS：1/3/7/14天间隔 + 25/15/8/4每日衰减）
- [x] 复习队列推送优化（SRS间隔 + 耐久度双重调度）
- [x] durability = 0 → 单词"碎裂"回到待学（自动更新 moduleProgress）
- [x] 答对恢复量递增（25 + reviewCount × 5）
- [x] 答错降级 SRS 等级

### 2.2 武器 ↔ 单词绑定 ✅
- [x] 学会一个单词 = 获得一把对应武器（等级 = SRS 等级：木剑→骑士剑→精灵弓→大师剑）
- [x] 武器列表页 WeaponList.vue（统计栏 + 筛选标签 + 武器卡片 + 耐久度条）
- [x] 点击碎裂武器 → 跳转重新学习
- [x] 首页入口「武器库 (N)」

### 2.3 Boss 战改进 ✅
- [x] Boss 血量不再每次重置（撤退保留，击败清除）
- [x] 自适应难度（连错降 easy 提示模式，连对3题回 normal）
- [x] 冒险地图显示「战斗中」状态

**实际耗时：~30分钟**

---

## 阶段三：趣味内容填充 ✅ 已完成

**目标：** 让104个单词的趣味内容全部到位。

### 3.1 语法点填充 ✅
- [x] 6个模块 grammarPoint 全部填充（中文解释 + 3-4个例句）
- [x] 覆盖教材全部语法：What do/does、to+不定式、less/fewer/more、need to、too+adj、already/yet、should

### 3.2 情景对话 ✅
- [x] 每模块 2-3 组 S1/S2 角色对话（12组共约80句）
- [x] 使用模块核心单词和语法点
- [x] 用词简单，适合五年级基础薄弱学生
- [x] 新建 content.js 独立数据文件

### 3.3 歌谣/韵文 ✅
- [x] 6个模块各一段英文歌谣（4-8行押韵）
- [x] 全部包含核心单词
- [x] 配中文翻译

**实际耗时：~10分钟**

---

## 阶段四：补充功能 ✅ 已完成

### 4.1 礼物兑换系统 ✅
- [x] 5个现实礼物（冰淇淋/游戏时间/文具盲盒/宠物体验/游乐场）
- [x] 兑换流程：选礼物 → 随机抽3个已学单词 → 跟老王说英语验证 → 确认兑换
- [x] 首页入口 + 独立 GiftShop.vue 页面
- [x] 兑换后自动检查成就

### 4.2 成就系统 ✅
- [x] 18个成就（6大类：学习/连续/星星/Boss/武器/特殊）
- [x] 成就墙 AchievementPage.vue（分类展示 + 进度条）
- [x] 自动检测：学会单词/击败Boss/连续打卡时自动解锁
- [x] 奖励发放：星星/道具/兑换券

### 4.3 语法情景学习 ✅
- [x] GrammarPage.vue（6模块切换）
- [x] 语法要点展示（格式化显示例句）
- [x] 情景对话（S1/S2角色，点击朗读TTS）
- [x] 歌谣朗读（逐行TTS播放）

### 4.4 前置补课入口 ✅
- [x] AssessmentPage.vue（8题基础测试）
- [x] 选择题 + 拼写题
- [x] 成绩评估 + 薄弱项建议
- [x] TTS 发音辅助

**实际耗时：~25分钟**

---

## 📊 总进度：阶段 0-4 全部完成 ✅

| 阶段 | 内容 | 状态 |
|------|------|------|
| 阶段零 | 数据层重构 | ✅ |
| 阶段一 | 核心学习闭环 | ✅ |
| 阶段二 | 间隔重复 + 武器耐久度 | ✅ |
| 阶段三 | 趣味内容填充 | ✅ |
| 阶段四 | 补充功能 | ✅ |

---

## 技术栈
- Vue 3 + Vite + Pinia + Vue Router
- Tailwind CSS（部分页面）+ Scoped CSS
- Web Speech API（TTS）
- Supabase（云存档，待配置）
- Netlify（部署）

## 线上地址
- https://english-hero.netlify.app

## 项目目录
- `src/data/` — words.js / bosses.js / weapons.js
- `src/stores/` — game.js（Pinia store）
- `src/views/` — Home / Adventure / WordLearn / ReviewPage / BossBattle / Shop / Profile
- `src/components/` — PinLogin / ChestOpen
- `src/lib/` — supabase.js
