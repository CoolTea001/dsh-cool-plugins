![dsh-cool-git cover](https://cdn.cooltea.top/dsh-cool-git/readme-cover-v0.5.0.png)

# dsh-cool-git

English · [中文](./README.zh.md)

[![GitHub: dsh-cool-git](https://img.shields.io/badge/GitHub-dsh--cool--git-181717?logo=github&logoColor=white)](https://github.com/CoolTea001/dsh-cool-plugins/tree/master/plugins/dsh-cool-git) [![npm: version](https://img.shields.io/npm/v/dsh-cool-git?logo=npm&logoColor=white)](https://www.npmjs.com/package/dsh-cool-git) ![license: MIT](https://img.shields.io/badge/license-MIT-green)

## Description

DeepSeek Harness Git plugin — adds a Git panel to the session tab bar: changes, commits, history, branches, remote sync, and merge-conflict resolution in one place, with AI-written commit messages.

## Features

- **Workspace-aware:** opens the repository of the current session
- **Changes & diffs:** folder tree, staged state, and per-file diffs
- **Commit history:** browse commits and their diffs
- **Commit:** commit the whole tree in one click, or only what is staged — the scope is a toolbar menu choice — with AI-written messages (model and prompt configurable per workspace)
- **Branches:** switch, create, delete (with risk marks), and merge
- **Remote:** fetch, pull, push, publish, and one-click sync (pull, then push); a pull merges rather than rebases
- **Merge conflicts:** a pull or branch merge that conflicts is left in the tree and resolved in the Diff pane — block by block, or one side everywhere — then marked resolved per file, or all at once

## Installation

Use DSH's add-plugin feature and enter the package name: `dsh-cool-git`
