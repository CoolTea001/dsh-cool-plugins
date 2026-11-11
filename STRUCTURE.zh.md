# 仓库结构

[English](STRUCTURE.md) | 中文

一个仓库承载全部 `dsh-cool-*` DSH 插件。每个插件仍然是独立的 npm 包、独立版本、独立安装单元——只有源码放在这里。

## 目录

```
dsh-cool-plugins/
├── plugins/          一个目录 = 一个发布的 npm 包
├── web/              独立站点（private，永不发布）
├── packages/         被上述两者消费的共享库
├── scripts/          仓库检查脚本
├── .github/          CI 工作流与发布辅助脚本
├── package.json      私有根 manifest，不带 `dsh` 字段
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

`pnpm-workspace.yaml` 里 `plugins/*`、`web/*`、`packages/*` 写成三条独立 glob 是刻意的。写成单条 `*/*` 不行：pnpm 不会递归进入没有 `package.json` 的目录，那样只会匹配到 `plugins/` 目录本身，里面的东西一个都找不到。

根 manifest 是 `private` 且刻意不带 `dsh` 字段。根上声明 `dsh.bundle` 会让仓库根自己看起来像一个可安装插件。

## 插件的两个半边

每个插件包都产出两个 bundle，它们的模块世界不同：

| 半边 | 格式 | 加载方 | 模块解析 |
|---|---|---|---|
| Host | ESM | Node | 普通 `import` |
| Client | CJS | 平台的模块加载器 | 自己的 `require` 表 |

Client 半边是一个文件，从 `lib/client.js` 提供，包成 `window.__ModuleLoader__.load({ id, factory })`。`id` 必须等于包名。

加载器只应答一组固定 specifier——`react`、`react-dom` 以及被种子化的 `@deepseek-ai/*` 包。其余全部必须内联。这一条规则就是为什么共享包要放 `devDependencies` 并带 `alwaysBundle`。

## 共享构建预设

`@dsh-cool/tsdown-config` 把上述两个事实固化下来，包本身不必重复：

```ts
// plugins/dsh-cool-git/tsdown.config.ts
import { dshPlugin } from '@dsh-cool/tsdown-config'

export default dshPlugin({ packageId: 'dsh-cool-git' })
```

它设置 Host 与 Client 的格式、加载器 banner/footer、种子的 `neverBundle` 列表，以及 `@dsh-cool/*` 的 `alwaysBundle`。包如果有额外的构建期常量就传 `clientDefine`；纯客户端插件就省略 `hostEntry`。

## 共享库

被插件消费的工作区库声明 `private: true` 并导出 TypeScript 源码：

```json
{
  "name": "@dsh-cool/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

导出源码意味着没有构建顺序依赖：tsdown 直接读 `.ts`，`tsc` 通过工作区软链接解析。

消费方用 `workspace:*` 声明在 `devDependencies` 里。它是构建期输入而非运行时依赖，因为它会被编进 `lib/`。声明在 `dependencies` 里会让 tsdown 把它当外部依赖，client bundle 里留下的 `require("@dsh-cool/ui")` 在浏览器里会抛错。

## Bundle 守卫

`scripts/check-client-bundles.mjs` 在 client bundle 仍然 require 某个 `@dsh-cool/*` 包时让构建失败。它通过 manifest 自己的 `exports["./client"]` 定位 bundle，而不是猜文件名，因此检查的是真正发出去的那个产物。

它作为 `pnpm run check` 的一部分运行，CI 里也会再跑一次。这是唯一能抓住「只在用户打开面板时才暴露」的那类失败的检查。

## 发布

`pnpm -r publish` 只发布 registry 上还没有该版本的包。bump 一个包就只发一个包。

```bash
pnpm --filter dsh-cool-git publish --access public
```

`private: true` 的包会被自动跳过，所以 `packages/*` 永远不需要手工排除。根 `LICENSE` 会被 pnpm 打进每个成员包。

## 装入 profile

包目录可以直接软链进 DSH profile，这也是本地开发插件的方式：

```bash
dsh plugin --profile desktop add link:/Users/cooltea/Desktop/dsh-cool-plugins/plugins/dsh-cool-git
```

软链的目录是活的 checkout，所以改完代码必须重新构建 `lib/`。Host 半边加载新代码需要重启；浏览器半边在页面刷新时读取重建后的 `client.js`。

## 新增一个插件

1. 复制一个已有的 `plugins/*` 目录作为起点。
2. 改它 `package.json` 里的 `name`、`version` 和 `dsh` 块。
3. 写它自己的 `cordis.patch.yml`，entry id 必须唯一。
4. 把它的 `repository` 指向本仓库，并带 `directory` 字段。
5. 跑 `pnpm install` 和 `pnpm run check`。
