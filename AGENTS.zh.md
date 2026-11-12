# AGENTS.zh.md

## 提交与推送规则

1. 未经许可，不要执行 `git commit` 或 `git push`。

## README 规则

1. 未经许可，不要更新 README（`README.md` / `README.zh.md`）。

## 图标规则

1. 只能使用 `packages/icons` 中 `@dsh-cool/icons` 导出的图标组件。
2. 不要临时内联 SVG，也不要从其他图标库引入图标。
3. 如果缺少所需图标，应提示用户将其补充到 `packages/icons`，不要在本地创建替代图标。

## 文档语言

1. `.md` 文件默认使用英文。
2. 添加 `.zh.md` 作为中文补充。
3. `.md` 与 `.zh.md` 必须保持同步。
