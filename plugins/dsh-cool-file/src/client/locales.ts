/**
 * The Files tab's copy, in the two locales DSH ships.
 *
 * The locale service re-renders the tab when the language is switched, which
 * only works if the copy is looked up at render time through the `t` seat rather
 * than captured in a constant. Placeholders are `{name}` and are filled by the
 * locale service; the two dictionaries must carry exactly the same keys, and
 * `zh` is typed as `typeof en` so a key forgotten in one is a compile error.
 */

/** The dictionary namespace this page owns. */
export const NS = 'coolFile'

/** The copy the page draws. */
const en = {
  /** The tab's own name in the session's tab bar. */
  'view.files': 'Files',

  'side.root': 'Workspace',
  'side.empty': 'This folder is empty',
  'side.error': 'Could not read this folder',
  'side.loading': 'Loading…',
  'side.truncated': 'Only the first entries are shown',
  'side.filtered': 'Only hidden items here',

  'action.refresh': 'Refresh',
  'action.toggleHidden': 'Show hidden files',

  'mode.label': 'View mode',
  'mode.preview': 'Preview',
  'mode.editor': 'Editor',

  'preview.empty': 'Select a file to preview it',
  'preview.emptyHint': 'Files in this session’s workspace appear here.',
  'preview.pane': 'File contents',
  'preview.loading': 'Reading file…',
  'preview.lines': '{count} lines',
  'preview.truncated': 'Showing the first {count} lines; the file continues.',
  'preview.imageLoading': 'Loading image…',
  'preview.imageFailed': 'Could not load this image',
  'preview.imageTooLarge': 'This image is larger than {size}, so it cannot be previewed.',
  'preview.imageOpen': 'Open the original image',
  'preview.imageClose': 'Close the image',
  'preview.imageDialog': 'Image preview',
  'preview.imageRetry': 'Try again',
  'preview.markdownLarge': 'This document is too large to render, so it is shown as source.',
  'preview.markdownPartial': 'Only the beginning of this document could be read, so it is shown as source.',
  'preview.notText': 'This is not a UTF-8 text file.',
  'preview.missing': 'This file no longer exists.',

  'markdown.copy': 'Copy',
  'markdown.copied': 'Copied',
  'markdown.footnotes': 'Footnotes',

  'editor.loading': 'Opening the editor…',
  'editor.error': 'Could not open this file for editing',
  'editor.tooLarge': 'This file is too large to edit, so it can only be previewed.',
  'editor.notText': 'This file is not UTF-8 text, so it can only be previewed.',
  'editor.missing': 'This file no longer exists.',
  'editor.unsaved': 'Unsaved changes',
  'editor.stale': 'The file changed on disk since you opened it. Reload it to keep editing.',
  'editor.saveFailed': 'Could not save this file',
  'editor.reload': 'Reload',
  'editor.plain': 'This file is large, so it is edited without syntax colours.',

  'error.read': 'Could not read this file',
} satisfies Record<string, string>

/** The Chinese copy, key for key the same page. */
export const zh: typeof en = {
  'view.files': '文件',

  'side.root': '工作区',
  'side.empty': '此文件夹为空',
  'side.error': '无法读取该文件夹',
  'side.loading': '加载中…',
  'side.truncated': '仅显示前若干个条目',
  'side.filtered': '此处只有隐藏项',

  'action.refresh': '刷新',
  'action.toggleHidden': '显示隐藏文件',

  'mode.label': '查看模式',
  'mode.preview': '预览',
  'mode.editor': '编辑',

  'preview.empty': '选择一个文件以预览',
  'preview.emptyHint': '此处显示当前会话工作区中的文件。',
  'preview.pane': '文件内容',
  'preview.loading': '正在读取文件…',
  'preview.lines': '{count} 行',
  'preview.truncated': '仅显示前 {count} 行，文件还有更多内容。',
  'preview.imageLoading': '正在加载图片…',
  'preview.imageFailed': '无法加载该图片',
  'preview.imageTooLarge': '图片超过 {size}，无法预览。',
  'preview.imageOpen': '查看原图',
  'preview.imageClose': '关闭图片',
  'preview.imageDialog': '图片预览',
  'preview.imageRetry': '重试',
  'preview.markdownLarge': '文档过大，无法渲染，因此以源文本显示。',
  'preview.markdownPartial': '文档只读取到开头部分，因此以源文本显示。',
  'preview.notText': '该文件不是 UTF-8 文本。',
  'preview.missing': '文件已不存在。',

  'markdown.copy': '复制',
  'markdown.copied': '已复制',
  'markdown.footnotes': '脚注',

  'editor.loading': '正在打开编辑器…',
  'editor.error': '无法用编辑器打开该文件',
  'editor.tooLarge': '文件过大，无法编辑，只能预览。',
  'editor.notText': '该文件不是 UTF-8 文本，只能预览。',
  'editor.missing': '文件已不存在。',
  'editor.unsaved': '未保存',
  'editor.stale': '文件已在磁盘上发生变化，重新加载后可继续编辑。',
  'editor.saveFailed': '无法保存该文件',
  'editor.reload': '重新加载',
  'editor.plain': '文件较大，编辑时不显示语法高亮。',

  'error.read': '无法读取该文件',
}

/** Every key the page can draw. */
export type MessageKey = keyof typeof en

/**
 * The translate seat the page draws through.
 *
 * A key and its placeholder values, read at call time: the function a locale
 * switch hands out is a new one, which is what re-renders the tab.
 */
export type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string

export { en }
