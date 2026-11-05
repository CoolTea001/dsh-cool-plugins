/**
 * The copy of the sidebar entry, the Daily Post page, and its settings dialog,
 * in the two locales DSH ships.
 *
 * The two dictionaries must carry exactly the same keys: `zh` is typed as
 * `typeof en`, so a key added to one and forgotten in the other is a compile
 * error rather than a page that falls back mid-sentence.
 */

/** The dictionary namespace this plugin owns. */
export const NS = 'coolDaily'

/** The translate seat the sidebar label and the page draw through. */
export type Translate = (key: string) => string

/** The English copy, which is also the fallback every lookup ends at. */
export const en = {
  'panel': 'Daily Post',
  'page.description': 'Articles written for you every day from your own prompt.',

  'search.placeholder': 'Search titles or content',
  'categories.all': 'All',
  'categories.label': 'Categories',
  'categories.unknown': 'Uncategorized',

  'generate.action': 'Generate now',
  'generate.running': 'Generating…',

  'settings.action': 'Settings',
  'settings.title': 'Daily Post settings',
  'settings.description': 'Tell the model what to write, how much, and when.',
  'settings.prompt': 'Prompt',
  'settings.promptHint': 'Describe the topics, angle, or style you want to read.',
  'settings.count': 'Articles per generation',
  'settings.days': 'Repeat days',
  'settings.cancel': 'Cancel',
  'settings.close': 'Close',
  'settings.save': 'Save',
  'settings.saving': 'Saving…',
  'settings.failed': 'Could not save settings',

  'list.emptyTitle': 'No daily posts yet',
  'list.emptyHint': 'Generated articles will appear here.',
  'list.noMatchTitle': 'No matching articles',
  'list.noMatchHint': 'Try another search or category.',

  'article.back': 'Back to list',
  'article.loading': 'Loading article…',
  'article.missing': 'This article no longer exists',
  'article.retry': 'Retry',

  'state.loading': 'Loading daily posts…',
  'state.error': 'The plugin Host half did not answer. Restart DSH and try again.',
  'state.retry': 'Retry',

  'weekday.0': 'Sun',
  'weekday.1': 'Mon',
  'weekday.2': 'Tue',
  'weekday.3': 'Wed',
  'weekday.4': 'Thu',
  'weekday.5': 'Fri',
  'weekday.6': 'Sat',
}

/** The Chinese copy, key for key the same page. */
export const zh: typeof en = {
  'panel': '每日贴',
  'page.description': '根据你的提示词，每天为你生成值得阅读的文章。',

  'search.placeholder': '搜索标题或内容',
  'categories.all': '全部',
  'categories.label': '分类',
  'categories.unknown': '未分类',

  'generate.action': '立即生成',
  'generate.running': '正在生成…',

  'settings.action': '设置',
  'settings.title': '每日贴设置',
  'settings.description': '告诉 AI 写什么、写多少，以及什么时候写。',
  'settings.prompt': '提示词',
  'settings.promptHint': '描述你想读的主题、角度或写作风格。',
  'settings.count': '每次生成数量',
  'settings.days': '重复生成的日期',
  'settings.cancel': '取消',
  'settings.close': '关闭',
  'settings.save': '保存',
  'settings.saving': '保存中…',
  'settings.failed': '设置保存失败',

  'list.emptyTitle': '还没有每日贴',
  'list.emptyHint': '生成后的每日贴会显示在这里。',
  'list.noMatchTitle': '没有匹配的文章',
  'list.noMatchHint': '换个关键词或分类试试。',

  'article.back': '返回列表',
  'article.loading': '正在读取文章…',
  'article.missing': '这篇文章已不存在',
  'article.retry': '重试',

  'state.loading': '正在载入每日贴…',
  'state.error': '插件 Host 端没有响应，请重启 DSH 后重试。',
  'state.retry': '重试',

  'weekday.0': '日',
  'weekday.1': '一',
  'weekday.2': '二',
  'weekday.3': '三',
  'weekday.4': '四',
  'weekday.5': '五',
  'weekday.6': '六',
}
