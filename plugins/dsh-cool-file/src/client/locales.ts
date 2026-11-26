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
  'side.error': 'Could not read this folder',
  'side.loading': 'Loading…',
  'side.truncated': 'Only the first entries are shown',
  'side.filtered': 'Only hidden items here',

  'action.refresh': 'Refresh',
  'action.toggleHidden': 'Show hidden files',
  'action.more': 'More',
  'action.copy': 'Copy',
  'action.copied': 'Copied',
  'action.copyFailed': 'Could not copy this file',

  'menu.rename': 'Rename',
  'menu.renameTitle': 'Rename',
  'menu.renameDescription': 'Enter a new name for “{name}”.',
  'menu.createFile': 'New file',
  'menu.createFileTitle': 'New file',
  'menu.createFileDescription': 'The file is created empty in “{folder}”.',
  'menu.createFolder': 'New folder',
  'menu.createFolderTitle': 'New folder',
  'menu.createFolderDescription': 'The folder is created inside “{folder}”.',
  'menu.reveal': 'Show in file manager',
  'menu.revealFinder': 'Show in Finder',
  'menu.revealExplorer': 'Show in File Explorer',
  'menu.delete': 'Delete',
  'menu.deleteFileTitle': 'Delete file',
  'menu.deleteFileDescription': 'Delete the file named “{name}”.',
  'menu.deleteFolderTitle': 'Delete folder',
  'menu.deleteFolderDescription': 'Delete the folder named “{name}” and everything inside it.',
  'menu.cancel': 'Cancel',
  'menu.working': 'Working…',
  'menu.exists': 'Something with that name already exists.',
  'menu.invalid': 'That name is not allowed.',
  'menu.gone': 'This item no longer exists.',
  'menu.readOnly': 'This session cannot change its workspace.',
  'menu.revealUnavailable': 'This workspace has no file manager to show it in.',
  'menu.unsupported': 'Only entries on the Host’s own filesystem can be changed here.',
  'menu.failed': 'That change could not be made',
  'menu.revealFailed': 'Could not show this item',

  'mode.label': 'View mode',
  'mode.preview': 'Preview',
  'mode.editor': 'Editor',
  'mode.previewMode': 'Preview mode',
  'mode.editorMode': 'Edit mode',
  'wrap.on': 'Allow wrapping',
  'wrap.off': 'Do not wrap lines',

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
  'side.error': '无法读取该文件夹',
  'side.loading': '加载中…',
  'side.truncated': '仅显示前若干个条目',
  'side.filtered': '此处只有隐藏项',

  'action.refresh': '刷新',
  'action.toggleHidden': '显示隐藏文件',
  'action.more': '更多',
  'action.copy': '复制',
  'action.copied': '已复制',
  'action.copyFailed': '无法复制该文件',

  'menu.rename': '重命名',
  'menu.renameTitle': '重命名',
  'menu.renameDescription': '输入“{name}”的新名称。',
  'menu.createFile': '新建文件',
  'menu.createFileTitle': '新建文件',
  'menu.createFileDescription': '将在“{folder}”中创建一个空文件。',
  'menu.createFolder': '新建文件夹',
  'menu.createFolderTitle': '新建文件夹',
  'menu.createFolderDescription': '将在“{folder}”中创建文件夹。',
  'menu.reveal': '在文件管理器中显示',
  'menu.revealFinder': '在 Finder 中显示',
  'menu.revealExplorer': '在文件资源管理器中显示',
  'menu.delete': '删除',
  'menu.deleteFileTitle': '删除文件',
  'menu.deleteFileDescription': '删除名为“{name}”的文件。',
  'menu.deleteFolderTitle': '删除文件夹',
  'menu.deleteFolderDescription': '删除名为“{name}”的目录及其中全部内容。',
  'menu.cancel': '取消',
  'menu.working': '处理中…',
  'menu.exists': '该名称已存在。',
  'menu.invalid': '该名称不可用。',
  'menu.gone': '该项已不存在。',
  'menu.readOnly': '当前会话无法修改其工作区。',
  'menu.revealUnavailable': '当前工作区没有可显示它的文件管理器。',
  'menu.unsupported': '此处只能修改宿主文件系统上的条目。',
  'menu.failed': '无法完成该修改',
  'menu.revealFailed': '无法显示该项',

  'mode.label': '查看模式',
  'mode.preview': '预览',
  'mode.editor': '编辑',
  'mode.previewMode': '预览模式',
  'mode.editorMode': '编辑模式',
  'wrap.on': '允许换行',
  'wrap.off': '禁止换行',

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
