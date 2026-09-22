import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMMAND_LABELS,
  CORE_LABELS,
  GLOSSARY,
  PLUGIN_TITLES,
  TAB_LABELS,
  bilingualFor,
  composeBilingual,
  isEnglishOnly,
  pluginTitle,
  shortPluginName,
  wordsOf,
} from "../src/bilingual.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BILINGUAL = /^[\u4e00-\u9fff][^\n]*[A-Za-z]/;

test("glossary composition: kebab and spaced labels", () => {
  assert.equal(composeBilingual("context-status"), "上下文状态 context-status");
  assert.equal(composeBilingual("Context"), "上下文 Context");
  assert.equal(composeBilingual("Memory System"), "记忆系统 Memory System");
  assert.equal(composeBilingual("My Plugins"), "我的插件 My Plugins");
  assert.equal(composeBilingual("Plugin configuration"), "插件配置 Plugin configuration");
  assert.equal(composeBilingual("theme"), "主题 theme");
  assert.equal(composeBilingual("PluginMarket"), "插件市场 PluginMarket"); // camelCase split
});

test("glossary composition: unknown words fall back to English (all-or-nothing)", () => {
  assert.equal(composeBilingual("univer-office"), null); // univer unknown
  assert.equal(composeBilingual("Skills & MCP"), null); // & and MCP unknown
  assert.equal(composeBilingual("github-search"), null); // github unknown
  assert.equal(composeBilingual("this label has far too many unknown words here"), null);
  assert.equal(composeBilingual("阅读"), null); // already Chinese
  assert.equal(composeBilingual("notes/foo.md"), null); // path-like
});

test("isEnglishOnly: rejects Chinese, paths, versions and blanks", () => {
  assert.equal(isEnglishOnly("context-status"), true);
  assert.equal(isEnglishOnly("Memory System"), true);
  assert.equal(isEnglishOnly("阅读"), false);
  assert.equal(isEnglishOnly("联网搜索 Search"), false);
  assert.equal(isEnglishOnly("dsh-better-display/README.md"), false);
  assert.equal(isEnglishOnly("v1.2.3"), false);
  assert.equal(isEnglishOnly(""), false);
  assert.equal(isEnglishOnly("   "), false);
});

test("bilingualFor: core copy is never wrapped", () => {
  for (const label of ["Goal", "Plan", "Feedback", "Permission", "Model", "Export", "Compact", "File"]) {
    assert.equal(bilingualFor(label, {}), null, `core label "${label}" must stay English`);
  }
});

test("bilingualFor: curated table wins over composition", () => {
  assert.equal(bilingualFor("search", COMMAND_LABELS), "联网搜索 Search");
  assert.equal(bilingualFor("enhance-prompt", COMMAND_LABELS), "提示词增强 Enhance Prompt");
  assert.equal(bilingualFor("context-status", COMMAND_LABELS), "上下文状态 Context Status");
  assert.equal(bilingualFor("why", COMMAND_LABELS), "历史检索 Why");
});

test("bilingualFor: command-shape gate blocks mention-popup rows", () => {
  assert.equal(bilingualFor("Memory System", TAB_LABELS), "记忆系统 Memory System");
  assert.equal(bilingualFor("Memory System", COMMAND_LABELS, { commandShape: true }), null);
  assert.equal(bilingualFor("dsh-omnisearch/notes", COMMAND_LABELS, { commandShape: true }), null);
});

test("plugin titles: curated, composed, and official-skipping", () => {
  assert.equal(pluginTitle("dsh-better-display"), "交互阅读 Better Display");
  assert.equal(pluginTitle("@dsh-external/dsh-context-compactor"), "上下文压缩 Context Compactor");
  assert.equal(pluginTitle("dsh-vision-assistant"), "视觉助手 Vision Assistant");
  assert.equal(pluginTitle("dshmarket"), "插件市场 Plugin Market");
  assert.equal(pluginTitle("dsh-bilingual-ui"), "界面双语 Bilingual UI");
  assert.equal(pluginTitle("@deepseek-ai/dsh-web"), null); // official: localized by core
  assert.equal(pluginTitle("some-future-plugin"), null); // unknown words → English
});

test("plugin titles: every installed workspace plugin resolves (no regression)", () => {
  const installed = [
    "dsh-archived-chats", "dsh-better-display", "dsh-context", "@dsh-external/dsh-context-compactor",
    "dsh-cool-theme", "dsh-cost-meter", "dshmarket", "@vectorize-io/hindsight-coding-agents",
    "dsh-mnemon", "dsh-my-plugins", "dsh-omnisearch", "dsh-plugin-capabilities",
    "dsh-plugin-config-compat", "dsh-plugin-mobile-gateway", "dsh-settings-mobile-nav",
    "dsh-settings-plugin-hub", "dsh-thoughtdag", "dsh-univer-office", "dsh-vision-assistant",
  ];
  for (const name of installed) {
    const title = pluginTitle(name);
    assert.match(title ?? "", BILINGUAL, `${name} must render bilingual (got ${title})`);
  }
});

test("plugin titles: future glossary-composable names work without an edit", () => {
  assert.equal(pluginTitle("dsh-session-archive"), "会话归档 session-archive");
  assert.equal(pluginTitle("dsh-mobile-gateway"), "移动网关 mobile-gateway");
  assert.equal(pluginTitle("theme-panel"), "主题面板 theme-panel");
});

test("shortPluginName mirrors the manager's compaction", () => {
  assert.equal(shortPluginName("@dsh-external/dsh-context-compactor"), "context-compactor");
  assert.equal(shortPluginName("dsh-better-display"), "better-display");
  assert.equal(shortPluginName("dshmarket"), "dshmarket");
  assert.equal(shortPluginName("@deepseek-ai/dsh-client-ui-chat"), "ui-chat");
});

test("wordsOf splits separators and camelCase", () => {
  assert.deepEqual(wordsOf("context-status"), ["context", "status"]);
  assert.deepEqual(wordsOf("Memory System"), ["Memory", "System"]);
  assert.deepEqual(wordsOf("PluginMarket"), ["Plugin", "Market"]);
  assert.deepEqual(wordsOf("settings_mobile nav"), ["settings", "mobile", "nav"]);
});

test("every curated value is 中文 English and unique per table", () => {
  const tables = { commands: COMMAND_LABELS, tabs: TAB_LABELS, plugins: PLUGIN_TITLES };
  for (const [name, table] of Object.entries(tables)) {
    const seen = new Map();
    for (const [key, value] of Object.entries(table)) {
      assert.match(value, BILINGUAL, `${name}/${key} → "${value}" is not 中文 English`);
      assert.notEqual(value, key);
      const owner = seen.get(value);
      assert.equal(owner, undefined, `${name}: "${value}" claimed by ${owner} and ${key}`);
      seen.set(value, key);
    }
  }
});

test("glossary values are non-empty Chinese", () => {
  for (const [word, chinese] of Object.entries(GLOSSARY)) {
    assert.match(word, /^[a-z]+$/, `glossary key "${word}" must be a plain lowercase word`);
    assert.match(chinese, /^[\u4e00-\u9fff]+$/, `glossary value for "${word}" must be Chinese`);
  }
});

test("build: lib/client.js is a valid ModuleLoader bundle", () => {
  execFileSync(process.execPath, [join(root, "scripts/build.mjs")], { stdio: "pipe" });
  const bundle = readFileSync(join(root, "lib/client.js"), "utf8");
  assert.match(bundle, /window\.__ModuleLoader__\.load\(\{/);
  assert.match(bundle, /id: "dsh-bilingual-ui"/);
  assert.match(bundle, /exports\.apply = apply;/);
  assert.match(bundle, /exports\.inject = inject;/);
  assert.match(bundle, /function pinBilingualLabels\(\)/);
  execFileSync(process.execPath, ["--check", join(root, "lib/client.js")], { stdio: "pipe" });
});

test("core denylist is lowercase and covers the shell's own commands", () => {
  for (const label of CORE_LABELS) assert.match(label, /^[a-z][a-z -]*$/, `"${label}" must be lowercase`);
  for (const label of ["goal", "compact", "export", "permission"]) {
    assert.equal(CORE_LABELS.has(label), true, `"${label}" must be in the denylist`);
  }
});
