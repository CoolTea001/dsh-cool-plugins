/**
 * The Markdown article store.
 *
 * An article is one file under `articles/`, named by its id, with a small
 * front-matter header for the fields the list needs. The files are the source of
 * truth: the list is rebuilt by reading the directory, so a file dropped in by
 * hand appears on the page and a deleted one disappears, without an index that
 * could disagree with the disk.
 *
 * Every write is one `writeFile` with an exclusive flag, so two generations
 * racing on the same second cannot silently overwrite each other.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { ArticleDetail, ArticleSummary } from '../shared/contract.js'
import { articlesDir } from './paths.js'

/** Generated ids; anything read back from a request must match this. */
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/

/** Front matter is this plugin's own header, not a general YAML document. */
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Characters left in a list card's excerpt. */
const EXCERPT_LENGTH = 150

/** The fields one article stores in its front matter. */
interface ArticleFields {
  title: string
  date: string
  category: string
  createdAt: string
}

/**
 * Validate an article id coming from the browser.
 *
 * The id becomes a path segment, so it is restricted to a conservative set and
 * anything else is refused before a path is built.
 */
export function isArticleId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

/** Render one front-matter value as a JSON/YAML double-quoted scalar. */
function scalar(value: string): string {
  return JSON.stringify(value)
}

/** Build the header written above every article body. */
function frontMatter(fields: ArticleFields): string {
  return [
    '---',
    `title: ${scalar(fields.title)}`,
    `date: ${scalar(fields.date)}`,
    `category: ${scalar(fields.category)}`,
    `createdAt: ${scalar(fields.createdAt)}`,
    '---',
    '',
  ].join('\n')
}

/** Read a scalar written by {@link frontMatter}, tolerating a plain value. */
function readScalar(raw: string): string {
  const value = raw.trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed === 'string') return parsed
    } catch {
      // Fall through to the unquoted spelling.
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  return value
}

/** Split one file into its stored fields and Markdown body. */
function parseArticle(text: string): { fields: Partial<ArticleFields>; content: string } {
  const match = FRONT_MATTER.exec(text)
  if (match === null) return { fields: {}, content: text }
  const fields: Partial<ArticleFields> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line)
    if (field === null) continue
    const value = readScalar(field[2])
    if (field[1] === 'title' || field[1] === 'date' || field[1] === 'category' || field[1] === 'createdAt') {
      fields[field[1]] = value
    }
  }
  return { fields, content: text.slice(match[0].length) }
}

/** Turn one body into the plain opening sentence a card shows. */
export function excerptOf(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, EXCERPT_LENGTH)
}

/** The local calendar day of one instant, as `YYYY-MM-DD`. */
export function localDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function summaryOf(id: string, text: string): ArticleSummary {
  const { fields, content } = parseArticle(text)
  const date = fields.date ?? id.slice(0, 10)
  return {
    id,
    title: fields.title?.trim() || '未命名每日贴',
    date,
    category: fields.category?.trim() || '未分类',
    createdAt: fields.createdAt ?? '',
    excerpt: excerptOf(content),
  }
}

/** Read every article, newest first. */
export async function listArticles(): Promise<ArticleSummary[]> {
  let names: string[]
  try {
    names = await readdir(articlesDir())
  } catch {
    return []
  }
  const articles: ArticleSummary[] = []
  for (const name of names) {
    if (!name.endsWith('.md')) continue
    const id = name.slice(0, -'.md'.length)
    if (!isArticleId(id)) continue
    try {
      const text = await readFile(join(articlesDir(), name), 'utf8')
      articles.push(summaryOf(id, text))
    } catch {
      // A file that vanished or cannot be read is simply not in the list.
    }
  }
  return articles.sort((left, right) =>
    right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt))
}

/** Read one article, or `undefined` when it does not exist or is unreadable. */
export async function readArticle(id: string): Promise<ArticleDetail | undefined> {
  if (!isArticleId(id)) return undefined
  const directory = resolve(articlesDir())
  const file = resolve(directory, `${id}.md`)
  if (!file.startsWith(`${directory}/`)) return undefined
  try {
    const text = await readFile(file, 'utf8')
    const summary = summaryOf(id, text)
    return { ...summary, content: parseArticle(text).content }
  } catch {
    return undefined
  }
}

/** One article the model produced, before it becomes a file. */
export interface GeneratedArticle {
  title: string
  category: string
  content: string
}

/**
 * Write one generated article as its own Markdown file.
 *
 * @param article - title, category, and Markdown body.
 * @param date - the local day it belongs to.
 * @param index - its position in the batch, which only distinguishes ids.
 * @returns the stored summary.
 */
export async function saveArticle(
  article: GeneratedArticle,
  date: string,
  index: number,
): Promise<ArticleSummary> {
  await mkdir(articlesDir(), { recursive: true })
  const now = new Date()
  const clock = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(part => String(part).padStart(2, '0'))
    .join('')
  const base = `${date}-${clock}-${index + 1}`
  const content = `${frontMatter({
    title: article.title,
    date,
    category: article.category,
    createdAt: now.toISOString(),
  })}${article.content.trim()}\n`
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = attempt === 0 ? base : `${base}-${attempt + 1}`
    try {
      await writeFile(join(articlesDir(), `${id}.md`), content, { encoding: 'utf8', flag: 'wx' })
      return summaryOf(id, content)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
  }
  throw new Error('无法为文章分配文件名')
}
