# dsh-cool-daily

English · [中文](./README.zh.md)

[![GitHub: dsh-cool-daily](https://img.shields.io/badge/GitHub-dsh--cool--daily-181717?logo=github&logoColor=white)](https://github.com/CoolTea001/dsh-cool-plugins/tree/master/plugins/dsh-cool-daily) ![license: MIT](https://img.shields.io/badge/license-MIT-green)

## Description

DeepSeek Harness daily plugin — writes an article for you every day from your own prompt, and keeps them as Markdown files in the session sidebar.

## Features

- **Daily Post panel:** a **Daily Post** row in the sidebar opens the article list, with a mark when unread articles are waiting
- **Your prompt, your topics:** describe the subjects, angle, or style you want to read, and every batch follows it
- **Model choice:** run on DSH's default model, or pin a provider, model, and reasoning effort for this plugin alone
- **Scheduled batches:** pick the weekdays, and one batch runs on each of them once the morning reaches 8:00; days already missed are not back-filled
- **Write another:** generate an extra batch at any time instead of waiting for the schedule
- **1 to 10 per batch:** set how many articles one generation writes
- **Browse and search:** filter by category, search titles or content, and open an article to read it in place
- **Tags:** each article carries tags drawn from its body, shown beside the category
- **Read receipts and delete:** opening an article marks it read and the unread mark follows; deleting removes the file
- **Plain Markdown files:** every article is a `.md` file with front matter under `$DSH_HOME/cool-daily/articles` (`~/.dsh/cool-daily/articles` by default)

## Installation

Use DSH's add-plugin feature and enter the package name: `dsh-cool-daily`
