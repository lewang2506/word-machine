# Astryx Starter

基于 [Astryx 设计系统](https://github.com/facebook/astryx)（Meta 开源，Beta v0.6.x）的 **Vite + React 19 + TypeScript** 起手模板，内置全部 7 个官方主题的一键预览演示页。

## 这个模板是什么

一个可以直接复制开新项目的最小 Astryx 工程：

- **脚手架**：`npm create vite@latest -- --template react-ts`
- **依赖**：`@astryxdesign/core`（组件与主题系统）、全部 7 个官方主题包 `@astryxdesign/theme-{neutral,butter,chocolate,matcha,stone,gothic,y2k}`、`@stylexjs/stylex`（peer 依赖）、`@astryxdesign/cli`（devDependencies）
- **已接线**：`index.css` 静态引入 core 的 reset / astryx 两份 CSS；7 个主题在 `src/App.tsx` 中**源码导入**，由 `Theme` provider 在运行时注入 token（多主题切换的正确姿势，见下文「官方主题一览与切换原理」）
- **演示页**：`src/App.tsx` 展示 Button、TextInput、Selector、SegmentedControl、Switch、CheckboxInput、Card、Badge、Avatar、ProgressBar、Toast（useToast）的真实用法；顶栏可一键切换 7 个设计风格 + 深浅模式

Astryx 发布的是**预构建 CSS + JS**，消费方不需要任何 StyleX 构建插件（`@astryxdesign/build` 是 Astryx 仓库内部用的）。

## 目录速览

```
astryx-starter/
├── .claude/CLAUDE.md   ← AI agent 上下文（组件索引 + CLI 工作流，勿手改，用 CLI 重新生成）
├── src/
│   ├── main.tsx        ← 入口：CSS 接线（此处保留）+ StrictMode
│   ├── App.tsx         ← 演示页：Theme provider 在这里包裹；顶栏为主题/深浅切换器
│   └── index.css       ← core 两份 CSS 引入（勿调整）+ 主题注入说明 + 少量 token 化页面样式
└── package.json        ← 含 npm run astryx 脚本
```

## AI Agent 上下文

`.claude/CLAUDE.md` 由 CLI 生成（`ASTRYX:START/END` 标记包裹），内容为当前版本的组件索引、发现型工作流（`build` → `template` → `component`）与样式规则。**升级 Astryx 后重新生成**：

```bash
npm run astryx -- init --features agents --agent claude
```

用 Claude Code 时它会被自动读取；其他工具可用 `--agent cursor|codex|...` 生成对应文件。

## 从模板开新项目

```bash
cp -r astryx-starter/ 我的新项目/   # 或复制整个目录
cd 我的新项目
rm -rf .git                          # 若复制时带入了 git 历史
# 编辑 package.json 的 "name" 字段
npm install
npm run dev
```

然后把 `src/App.tsx` 换成你的页面即可；`main.tsx` 的接线不用动。

## astryx CLI 速查

已配置 `npm run astryx` 脚本，以下命令等价于 `npx astryx <cmd>`：

| 命令 | 用途 |
|---|---|
| `npm run astryx -- search "<关键词>"` | 一次搜索组件 / hook / 文档 / 模板 |
| `npm run astryx -- build "<页面想法>"` | 输出组合工具包（最合适的页面模板 + 区块 + 组件）；无参数输出完整工作流手册 |
| `npm run astryx -- component --list` | 列出全部 164 个组件 |
| `npm run astryx -- component Button` | 查某个组件的完整 props / 示例 / 主题化方式 |
| `npm run astryx -- template --list` | 浏览页面与区块模板 |
| `npm run astryx -- template dashboard` | 输出整页源码（加 `--skeleton` 得到布局骨架） |
| `npm run astryx -- theme list` | 列出可添加的官方主题 |
| `npm run astryx -- theme build <文件>` | 把自定义主题（defineTheme）编译成生产用 CSS |
| `npm run astryx -- theme template` | 生成带注释的主题模板文件 |
| `npm run astryx -- upgrade --apply` | 版本升级后跑 codemod 迁移 |
| `npm run astryx -- docs theme` | 主题化指南；`docs tokens` 为 token 参考 |
| `npm run astryx -- swizzle Button` | 弹出组件源码做深度定制 |

**写 UI 前先查文档再动手**：`component <Name>` 查 props，不要凭记忆猜。

## 官方主题一览与切换原理

starter 已安装**全部 7 个官方主题**（均为 v0.6.3），演示页顶栏的 Selector 可一键预览：

| 主题包 | 导入（源码，运行时注入） | 风格 |
|---|---|---|
| `@astryxdesign/theme-neutral` | `import {neutralTheme} from '@astryxdesign/theme-neutral'` | 极简灰：克制的暖灰，系统字体 |
| `@astryxdesign/theme-matcha` | `import {matchaTheme} from '@astryxdesign/theme-matcha'` | 抹茶绿：泥土绿意，自然沉稳 |
| `@astryxdesign/theme-chocolate` | `import {chocolateTheme} from '@astryxdesign/theme-chocolate'` | 暖棕：浓郁棕色配 Fraunces 衬线标题 |
| `@astryxdesign/theme-butter` | `import {butterTheme} from '@astryxdesign/theme-butter'` | 金黄：奶油黄表面配蓝色点缀 |
| `@astryxdesign/theme-stone` | `import {stoneTheme} from '@astryxdesign/theme-stone'` | 暖石：石板灰，质朴手作感 |
| `@astryxdesign/theme-gothic` | `import {gothicTheme} from '@astryxdesign/theme-gothic'` | 暗黑：**仅深色**，深蓝灰 + 哥特展示字体 |
| `@astryxdesign/theme-y2k` | `import {y2kTheme} from '@astryxdesign/theme-y2k'` | 千禧：辣粉青柠，Poppins 复古流行 |

### 为什么用源码导入而不是 7 份 theme.css 全静态引入

多主题运行时切换必须用**源码导入**（不带 `/built` 的子路径）：

- `<Theme>` provider 对源码主题会在挂载时通过 `useInsertionEffect` 把 token 编译成 `<style>` 注入 `@layer astryx-theme`，并 `@scope` 到 `[data-astryx-theme="<主题名>"]`；切换主题时旧 `<style>` 被清理、新主题注入，wrapper 上的主题属性同步变化，token 随之整体替换。
- 若把 7 份 `theme.css` 全部静态引入，它们同在 `@layer astryx-theme` 层，按文档顺序后者覆盖前者，同名 token（如 `--color-accent`）会互相层叠冲突。
- `/built` + `theme.css` 是**单主题**的优化方案（首屏无闪烁、SSR 安全），不支持运行时互斥切换。
- 因此 `index.css` 只静态保留 core 的 `reset.css` / `astryx.css`（基础层），主题层完全交给 provider 注入。参考 `npx astryx docs theme` 的 "Runtime vs Built Themes" 一节。

### 新项目里只保留一个主题

正式项目通常只用一个主题。以只留 neutral 为例：

1. 卸载多余主题包：

   ```bash
   npm uninstall @astryxdesign/theme-butter @astryxdesign/theme-chocolate \
     @astryxdesign/theme-gothic @astryxdesign/theme-matcha \
     @astryxdesign/theme-stone @astryxdesign/theme-y2k
   ```

2. `src/App.tsx` 删除 6 个主题 import 与 `THEMES` 注册表，改用预构建方案（性能更好、SSR 安全）：

   ```tsx
   import {neutralTheme} from '@astryxdesign/theme-neutral/built';
   import '@astryxdesign/theme-neutral/theme.css';

   <Theme theme={neutralTheme} mode={mode}>…</Theme>
   ```

3. `src/index.css` 在两份 core CSS 之后加回 `@import '@astryxdesign/theme-neutral/theme.css';`（顺序：reset → astryx → theme）。

4. 顶栏的 `Selector` 与主题相关状态可整体删除，只保留深浅模式 Switch。

### 主题定制

#### 方式一：CSS 自定义属性覆盖（微调）

Astryx 的所有颜色、间距、圆角、字体都是 CSS 自定义属性（如 `--color-accent`、`--radius-container`、`--font-family-body`）。在 `src/index.css` 的官方 CSS 之后追加覆盖即可（无层 CSS 优先级高于 `@layer` 内的注入样式）：

```css
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';

/* 覆盖示例：品牌色（scoped 到主题属性，勿在 :root 覆盖 --color-*） */
[data-astryx-theme='neutral'] {
  --color-accent: oklch(0.55 0.18 260);
}
```

#### 方式二：`theme add` 拷贝官方主题为可编辑源码

```bash
npm run astryx -- theme list          # 浏览主题（含各主题 slug）
npm run astryx -- theme add stone     # 把 stone 拷贝进项目成为你拥有的源码
```

拷出来的文件（含嵌套 palette 模块）是项目源码，可随意改色板、字体、组件覆盖；重复 add 需要 `--overwrite`。

#### 方式三：defineTheme 自定义主题（从零或继承）

```bash
npm run astryx -- theme template    # 生成带全字段注释的 theme.template.ts
```

`defineTheme` 支持 `color / typography / radius / motion` 生成式 scale、显式 `tokens` 覆盖、`components` 组件级覆盖、`extends` 继承已有主题（如 `extends: neutralTheme` 只改品牌色）。详细参考 `npm run astryx -- docs theme`。

```bash
npm run astryx -- theme build <文件> # 编译成生产用 theme.css + built 入口
```

随后在入口把 `neutralTheme` 换成你的主题，CSS 引入换成编译产物。

## 深浅模式

`Theme` provider 支持 `mode` prop（`'light' | 'dark' | 'system'`，默认 `system`）。演示页在 `src/App.tsx` 用一个 Switch 切换，root Theme 会自动把 `data-theme` / `data-astryx-theme` 同步到 `<html>`。

注意 **gothic 是 dark-only 主题**（token 全为单值，明暗恒定）：按官方 README 的建议，切到 gothic 时演示页自动锁定 `mode="dark"` 并禁用深浅开关，保证滚动条等浏览器原生外观与深色页面一致；切走后恢复之前的深浅选择。

## 注意事项

- **Beta 软件**：Astryx 处于 Beta（v0.6.x），API 可能变动。升级依赖后先跑 `npm run astryx -- upgrade --apply`，再重新生成 `.claude/CLAUDE.md`。
- **图表组件未稳定**：需要图表时用 ECharts / Chart.js 代替，等 Astryx 图表组件转正后再迁移。
- **CSS 引入顺序不能乱**：静态只引 core 两份 `reset.css` → `astryx.css`（`@layer reset / astryx-base`）；主题层 `@layer astryx-theme` 由 `Theme` provider 运行时注入，不静态引入（见「官方主题一览与切换原理」）。若改回单主题静态方案，顺序为 `reset.css` → `astryx.css` → `theme.css`。
- **不要用 xstyle / Tailwind 工具类直接写**：本模板消费预构建产物，没有 StyleX 编译器；自定义样式用组件 props 优先，其次 token 变量（`var(--color-*)` 等）。
- **React 19+ 是硬性要求**（peer 依赖）。

## 常规命令

```bash
npm run dev      # 开发服务器
npm run build    # tsc + vite 生产构建
npm run preview  # 预览构建产物
npm run lint     # oxlint
```
