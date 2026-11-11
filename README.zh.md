# dsh-cool-plugins

[English](README.md) | 中文

本仓库集中维护多款 DeepSeek Harness（DSH）插件。每个插件仍是独立的 npm 包，拥有独立的版本号和安装单元，这里只存放它们的源码。

## 插件列表

| 插件 | 简介 | 文档 | 已发布 |
|---|---|---|---|
| [`dsh-cool-theme`](plugins/dsh-cool-theme) | 外观切换：预设主题、自定义主题与主题分享 | [`README`](plugins/dsh-cool-theme/README.md) | 是 |
| [`dsh-cool-terminal`](plugins/dsh-cool-terminal) | 在会话标签栏中提供真实 shell，支持工作区同步与命令补全 | [`README`](plugins/dsh-cool-terminal/README.md) | 是 |
| [`dsh-cool-git`](plugins/dsh-cool-git) | Git 面板：查看改动、提交、历史与分支，同步远端，解决冲突 | [`README`](plugins/dsh-cool-git/README.md) | 是 |
| [`dsh-cool-file`](plugins/dsh-cool-file) | Files 标签页：浏览工作区并预览文本文件 | [`README`](plugins/dsh-cool-file/README.md) | 否 |
| [`dsh-cool-session`](plugins/dsh-cool-session) | 设置中的 Sessions 页：搜索、筛选、归档与批量删除 | [`README`](plugins/dsh-cool-session/README.md) | 否 |
| [`dsh-cool-daily`](plugins/dsh-cool-daily) | 按自定义提示词生成每日 AI 文章 | [`README`](plugins/dsh-cool-daily/README.md) | 否 |

## 安装插件

使用 DSH 的新增插件功能，输入对应的包名即可安装，例如 `dsh-cool-theme`。表中尚未发布的插件，可按「链接到 profile」一节在本地安装。

## 开发

```bash
pnpm install
pnpm run check     # 语言包守卫 → 各包的 check → 客户端产物守卫
pnpm run build     # 构建全部包
pnpm run dev       # 监听并重建全部包
```

环境要求：Node `^22.19.0 || >=24.0.0`，pnpm `11.28.9`（由 `packageManager` 字段锁定）。

## 链接到 profile

插件目录可以直接软链接到 DSH profile 中，本地开发也采用这种方式：

```bash
dsh plugin --profile desktop add link:<repo>/plugins/dsh-cool-git
```

软链接指向的是实时的工作副本，因此修改代码后必须重新构建 `lib/`。

Host 端加载新代码需要重启 DSH；浏览器端在页面刷新时会读取重新构建后的 `client.js`。由于 `lib/` 同样提交到仓库，源码改动只有连同重新构建的产物一起提交才算完成。

## 参与贡献

欢迎提交 Issue 与 PR。

## 许可证

MIT © CoolTea
