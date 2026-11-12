# @dsh-cool/icons

本仓库插件共享的私有、仅客户端 React 图标包。

每个图标都是普通的 `.tsx` 组件，插件 bundle 只会内联它实际 import 的图标。没有运行时资源请求，没有 SVG loader，也没有代码生成步骤。

## 使用

这是 workspace 内的 devDependency。`@dsh-cool/tsdown-config` 会把它内联进插件的 client bundle，因此不能放到 `dependencies`。

```json
{
  "devDependencies": {
    "@dsh-cool/icons": "workspace:*"
  }
}
```

```tsx
import { IconPlus, IconTrash } from '@dsh-cool/icons'

<IconPlus />
<IconTrash size={14} className="danger" />
```

所有图标使用同一组 props：

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `size` | `number` | 方形边长（px），默认 `16`。 |
| `className` | `string` | 给负责布局的外层容器补充 class。 |
| `title` | `string` | 可访问名称；不传时图标为 `aria-hidden`。 |

图形使用 `currentColor` 绘制，因此 hover、disabled、danger 等颜色由外层控件决定。`size` 是 presentation attribute，`.dsh-cg-icon svg { width: 13px }` 这类 CSS 规则仍然可以覆盖它。

## 添加图标

1. 新建 `src/<name>.tsx`：

   ```tsx
   import type { ReactElement } from 'react'
   import { IconBase, type IconProps } from './icon.js'

   export function IconBookmark(props: IconProps): ReactElement {
     return (
       <IconBase {...props} viewBox="0 0 24 24">
         <path
           fill="none"
           stroke="currentColor"
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth="2"
           d="M6 4h12v17l-6-5l-6 5z"
         />
       </IconBase>
     )
   }
   ```

2. 在 `src/index.ts` 中导出。
3. 运行 `pnpm --filter @dsh-cool/icons check`。

约定：

- 默认使用 24×24 viewBox；少数图形需要别的网格时保留它自己的 viewBox（npm 标是 128×128）。
- 单色图标使用 `currentColor`；品牌标可以保留自己的颜色。
- 根节点的 `width` / `height` / `xmlns` 由 `IconBase` 负责，不要在图标文件里重复。
- 保留图形自己的 `strokeWidth`；图标集不强制统一描边粗细。
- `title` 用于可访问名称。菜单行、图标按钮这类外层已经有文案的场景，让外层控件承担标签更好。

SVG 属性按 JSX 写法：`stroke-width` → `strokeWidth`、`stroke-linecap` → `strokeLinecap`、`fill-rule` → `fillRule`、`class` → `className`。

## 插件本地图标

插件专属图形不必放进这个包。import `IconBase`，复用同一套根节点契约即可：

```tsx
import { IconBase, type IconProps } from '@dsh-cool/icons'

export function IconLocal(props: IconProps) {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path d="…" fill="none" stroke="currentColor" strokeWidth="2" />
    </IconBase>
  )
}
```

## 图标 catalog

catalog 是 `catalog/` 下的开发用 Vite 页面，不从包入口导出，也不会被插件引用。

```bash
pnpm --filter @dsh-cool/icons dev:catalog
```

它是一个只读 catalog：列出 `src/index.ts` 导出的全部图标，同时展示组件名称和源文件名，搜索框会同时匹配两者。没有尺寸、颜色或复制操作。页面使用 Mono 浅色主题，页头在滚动时固定，图标名称和文件名居中展示。

静态构建：

```bash
pnpm --filter @dsh-cool/icons build:catalog
pnpm --filter @dsh-cool/icons preview:catalog
```

## DOM 注入

这个包导出的是 React 组件，不是 SVG 字符串。如果插件需要把标记写进 shell 自己的 DOM（例如 theme 的 palette、session 的 archive 导航图标），应把字符串留在插件本地。如果这类场景变多，另一种做法是用 `react-dom/client` 的 `createRoot` 把组件渲染进那个位置。

## 说明

- 包是 `private` 且源码直出的，`pnpm -r publish` 会跳过它。
- 如果将来需要发布，再增加输出 `lib/` 的构建并把 `exports` 指向产物；组件 API 不变。
- 大部分图形来自 Lucide Icons；GitHub 标来自 Bootstrap Icons，npm 标来自 Devicon。见 `THIRD_PARTY_NOTICES.md`。
- 单个图标文件有意不写来源注释；来源和许可证文本统一放在 `THIRD_PARTY_NOTICES.md`，任何内联这些图形的分发物都应保留该文件。
