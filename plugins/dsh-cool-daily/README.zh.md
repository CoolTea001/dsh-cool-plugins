# dsh-cool-daily

[English](./README.md) · 中文

[![GitHub: dsh-cool-daily](https://img.shields.io/badge/GitHub-dsh--cool--daily-181717?logo=github&logoColor=white)](https://github.com/CoolTea001/dsh-cool-plugins/tree/master/plugins/dsh-cool-daily) ![license: MIT](https://img.shields.io/badge/license-MIT-green)

## 描述

DeepSeek Harness 每日贴插件 —— 按你写的提示词每天生成文章，以 Markdown 文件保存在会话侧边栏中。

## 功能介绍

- **每日贴面板：** 侧边栏「每日贴」入口打开文章列表，有未读文章时显示角标
- **提示词决定内容：** 描述你想读的主题、角度或写作风格，每次生成都按它来写
- **自选模型：** 跟随 DSH 的默认模型，或单独为本插件固定供应商、模型与思考强度
- **定时生成：** 选定星期几，当天上午 8:00 之后自动生成一批；错过的日期不会补写
- **再来一篇：** 不必等定时任务，随时手动多生成一批
- **每批 1 到 10 篇：** 可设置一次生成写几篇
- **浏览与搜索：** 按分类筛选、按标题或正文搜索，点开即可在页内阅读全文
- **标签：** 每篇文章带从正文提炼的标签，与分类并列展示
- **已读与删除：** 打开文章即标记已读，未读角标随之减少；删除会移除对应文件
- **纯 Markdown 文件：** 每篇文章是带 front matter 的 `.md` 文件，存放于 `$DSH_HOME/cool-daily/articles`（默认 `~/.dsh/cool-daily/articles`）

## 安装

使用 DSH 的添加插件功能，输入包名：`dsh-cool-daily`
