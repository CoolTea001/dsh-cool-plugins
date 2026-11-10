/**
 * Simplified Chinese dictionary — the key-set source of truth.
 *
 * Every other dictionary is typed against `TerminalKey`, which is derived from
 * this file. Adding a key here makes every other dictionary fail to compile
 * until it is translated too, which is the point: a missing translation is a
 * build error, not a key name shown to the user.
 */

export const zh = {
  'view.tab': '终端',
  'sidebar.session': '当前会话',
  'sidebar.empty': '暂无工作区',
  'sidebar.new': '新建终端',
  'main.hint': '请在左侧工作区点击 ＋ 新建一个终端',
  'terminal.rename': '重命名',
  'terminal.remove': '删除',
  'terminal.removeTitle': '删除 {title}？',
  'terminal.removeWarning': '会中断正在运行命令，且删除后无法恢复。',
  'terminal.startup': '命令自启',
  'terminal.startupDescription': '开启后，DSH 启动后会自动运行设置的命令',
  'terminal.startupCommand': '命令',
  'terminal.startupPlaceholder': '如 pnpm dev',
  'terminal.startupAutoRun': '自动运行',
  'terminal.save': '保存',
  'terminal.close': '关闭',
  'terminal.cancel': '取消',
  'terminal.more': '更多操作',
  'terminal.input': '终端输入',
  'terminal.ended': '已结束',
  'terminal.exitCode': '退出码 {code}',
  'terminal.signal': '信号 {signal}',
  'terminal.unknown': '未知错误',
  'terminal.startFailed': '无法启动终端：{detail}',
  'terminal.endedBanner': '［终端结束：{detail}］',
  'terminal.reason.outputFailed': '输出流已中断',
  'commands.title': '常用命令',
  'commands.description': '点击命令插入到当前终端，或使用行内操作管理。',
  'commands.search': '搜索',
  'commands.searchLabel': '搜索常用命令',
  'commands.add': '添加命令',
  'commands.bodyPlaceholder': '命令，如 pnpm dev',
  'commands.descriptionPlaceholder': '描述（可选）',
  'commands.noDescription': '暂无描述',
  'commands.empty': '暂无常用命令，点击「添加命令」创建',
  'commands.noMatch': '没有匹配的命令',
  'commands.insertHint': '插入到当前终端',
  'commands.noActiveTerminal': '当前没有激活的终端',
  'commands.edit': '编辑',
  'commands.copy': '复制',
  'commands.remove': '删除',
  'commands.copied': '已复制',
  'commands.cancel': '取消',
  'commands.save': '保存',
  'commands.close': '关闭',
  'completion.footer': '↑↓ 选择 · Enter 填充 · Esc 关闭',
} satisfies Record<string, string>
