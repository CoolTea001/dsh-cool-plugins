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

  'preview.empty': 'Select a file to preview it',
  'preview.emptyHint': 'Files in this session’s workspace appear here.',
  'preview.loading': 'Reading file…',
  'preview.lines': '{count} lines',
  'preview.truncated': 'Showing the first {count} lines; the file continues.',

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

  'preview.empty': '选择一个文件以预览',
  'preview.emptyHint': '此处显示当前会话工作区中的文件。',
  'preview.loading': '正在读取文件…',
  'preview.lines': '{count} 行',
  'preview.truncated': '仅显示前 {count} 行，文件还有更多内容。',

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
