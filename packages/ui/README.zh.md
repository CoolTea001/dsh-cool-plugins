# @dsh-cool/ui

本仓库 DSH 插件共用的私有、源码直出 React UI 包。它只为一件事服务：让每个插件页面都由同一批零件拼成，用户不会遇到「空状态到底长什么样」「正文列到底多宽」两种答案。

它是仅工作区使用的开发依赖。`@dsh-cool/tsdown-config` 会把所有 `@dsh-cool/` 作用域的包内联进每个插件的 client bundle，因此它不能被移到 `dependencies`：页面的模块表不认识它，运行时 `require` 只会在用户打开那个面板时才抛错。

## 它不负责什么

不定义调色板、字号体系、圆角。这里每条规则命名的颜色都是 `--dsw-*` 主题 token，所以页面跟随当前明暗外观——包括 `dsh-cool-theme` 提供的第三方预设。平台自己的控件仍然属于平台：它们带着真实类型被重新导出，而不是被重新实现一遍，因为重新实现一份就是产品要长期同步维护的第二个控件。

## 它负责什么

| 层 | 导出 | 为什么共享 |
| --- | --- | --- |
| 样式 | `insertPluginStyles`、`UI_CSS`、`uiClass` | 一条注入路径、一个标签、一条「谁能删除它」的规则 |
| 样式 | `composerSeatCss`、`wallpaperCss` | 两条必须与所并入样式表保持一致的选择器 |
| 布局 | `ResizeHandle` | 全仓可拖拽边界共用的一套指针手势 |
| 布局 | `readLayout`、`parseLayout`、`writeLayout`、`finiteNumber`、`fraction`、`clampSideWidth` | 记住的宽度是数据，不是事实 |
| 外壳 | `suppressComposerSeat`、`useComposerSeatSuppression` | Conversation 外壳为每个 View 都挂着输入席 |
| Markdown | `inheritFileDrag`、`refuseFileDrag` | 渲染器唯一一个不可省略的回调 |
| 基元 | `Button`、`Modal`、`Input`、`Menu` 等 | 一处声明平台 API，而不是每个插件各写一份 |

## 用法

```json
{
  "devDependencies": {
    "@dsh-cool/ui": "workspace:*"
  }
}
```

```ts
// src/client/index.ts
import { insertPluginStyles } from '@dsh-cool/ui'

export function apply(ctx: any): void {
  ctx.effect(() => insertPluginStyles(PACKAGE_ID, PAGE_CSS), 'dsh-cool-x: styles')
}
```

```ts
// src/client/layout.ts
import { finiteNumber, fraction, readLayout, writeLayout } from '@dsh-cool/ui'

const KEY = 'dsh-cool-x.layout.v1'
const FIELDS = { sideWidth: finiteNumber(300), filesShare: fraction(0.5) } as const

export const readSideLayout = () => readLayout(KEY, FIELDS)
export const writeSideLayout = (layout: Layout) => writeLayout(KEY, layout)
```

```tsx
// src/client/page.tsx
import { ResizeHandle, useComposerSeatSuppression, composerSeatCss } from '@dsh-cool/ui'
```

由于是内联的，改动这个包之后必须重建每个使用方插件，页面才会变化。这是换取「各插件独立版本、零运行时耦合」的代价。

## 约定

- **不含文案。** 组件通过 props 接收文字——标签、无障碍名称、状态词。只有插件知道当前语言。
- **不写 DOM、不持有 `<style>`、不向 `document.body` 追加节点。** portal 由平台的 `Modal` 负责；样式表由插件的 `apply()` 负责。
- **受控。** 打开状态、分栏宽度、草稿都归调用方；持久化 key 由调用方传入。
- **只用 token。** `--dsw-alias-*`、`--dsw-radius-*`、`--dsw-focus-ring-*`。唯一的字面色是纯透明和 `color-mix()` 的压暗运算。
- **不写 `<svg>`。** 图标来自 `@dsh-cool/icons`。

`scripts/check-ui-boundary.mjs` 会守住后两条，另外守两条模块图规则：只有本包可以直接引用平台 primitives，已发布的 `.d.ts` 不得出现 `@dsh-cool/` 包。

## 新增组件

1. 放到 `src/<区域>/` 下。
2. 从 `src/index.ts` 导出，并写一行注释说明用途。
3. 如果带样式，把规则加进 `UI_CSS`，不要另起一张表。
4. 运行 `pnpm --filter @dsh-cool/ui check`。

## 说明

- 本包是 `private`、源码直出。`pnpm -r publish` 会跳过它。
- 它只在类型层面依赖 `@deepseek-ai/dsh-client-ui-primitives`，并锁定为所安装 DSH 携带的版本。版本对不上就会描述出一个运行时不存在的 API——手写声明曾因此让一个插件给没有该属性的 `Menu` 传 `anchorRef`。
