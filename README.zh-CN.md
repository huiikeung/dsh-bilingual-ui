# dsh-bilingual-ui

**把第三方插件的英文界面标签，在运行时改写成「中文 + English」。** 例如命令弹窗里的 `/search` 显示 **联网搜索 Search**，插件管理页的 better-display 显示 **交互阅读 Better Display**。

不改 DSH 核心、不改任何其他插件的源码，也不打核心补丁 —— 全部是浏览器端的运行时 DOM 改写，所以：

- **DSH 升级不影响**：核心怎么更新都冲不到这个插件；
- **其他插件更新不影响**：标签文案变了就按新文案重新包（见下面的三级解析）；
- **以后新装的插件也生效**：内置常用词词典，英文标签自动拼成中文（`context-status` → `上下文状态`），不需要改代码；
- **本插件停用/卸载**：所有标签恢复各插件自己的原文，不会留下半改写状态。

## 覆盖的界面

| 界面 | 示例 |
|---|---|
| 命令弹窗（输入 `/`）左侧标签 | `联网搜索 Search`、`上下文状态 Context Status`、`外置记忆 Mnemon`、`历史检索 Why` |
| 标签页（聊天区 + 设置 → 内置插件页） | `上下文 Context`、`记忆系统 Memory System`、`插件配置 Plugin Configuration`、`我的插件 My Plugins` |
| 插件管理页卡片（列表 + 详情大标题） | `交互阅读 Better Display`、`视觉助手 Vision Assistant`、`上下文压缩 Context Compactor` … |

## 三条边界

1. **DSH 官方/core 的文案不动** —— `Goal` / `Plan` / `Compact` / `General` / `Models` / `Chat` / `Trajectory` 等保持英文（清单见 `CORE_LABELS`）。
2. **本来就是中文的标签不动** —— 例如 better-display 的「阅读」页签，只包英文标签，不给中文标签加英文后缀。
3. **设置左侧栏的分页名不动** —— 左栏行是被多个插件**按标签文本**定位的：`dsh-settings-plugin-hub` 靠标签比对把分页收进「第三方插件」页（固定 / 取消固定 / 跳转全靠它），`dsh-better-display` / `dsh-context-compactor` / `dsh-archived-chats` 靠标签固定各自的导航图标。改写左栏标签会让这些插件静默失效（实测：收纳页跳转失灵、该收走的分页收不走）。左栏保持各插件自己的字典文案；若想让左栏变中文，把 DSH 界面语言切成中文即可（各插件会走自己的中文词典）。

## 三级解析（新插件为什么也能双语）

1. **curated 精确表**：`COMMAND_LABELS` / `TAB_LABELS` / `PLUGIN_TITLES`，措辞比机器拼装更顺（如「提示词增强」而非「增强提示词」）。
2. **常用词词典** `GLOSSARY`：英文标签按单词查表拼中文，**全部单词都认识才包**（`context-status` → `上下文状态`，`My Plugins` → `我的插件`）；有一个词不认识就保持英文，绝不输出半中半英的夹生货。
3. **都不中 → 保持英文**：安全的默认。

词表不够用时，直接往 `src/bilingual.mjs` 的 `GLOSSARY` 里加一行（`word: "中文"`），或往 curated 表里加一条精确映射。

## 安装

```sh
cd /vol1/1000/Deepseek-Harness/工作台/插件/dsh-bilingual-ui
pnpm test          # 生成 lib/client.js 并跑单测
dsh plugin --profile web add link:/vol1/1000/Deepseek-Harness/工作台/插件/dsh-bilingual-ui
# 重启 DSH 生效（host 要挂载新 bundle）；之后改 src 只需 pnpm test + 刷新页面
```

## 开发

```sh
pnpm test   # = node scripts/build.mjs && node --test test/*.test.mjs
```

- `src/bilingual.mjs` —— 引擎（纯 ESM， Node 直接可测）
- `scripts/build.mjs` —— 把 src 包成 `lib/client.js`（ModuleLoader bundle，无第三方依赖）
- `lib/index.js` —— 宿主半边空实现（本插件纯浏览器端）

## 卸载

`dsh plugin --profile web remove dsh-bilingual-ui`，重启后所有标签恢复原样。
