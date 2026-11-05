/**
 * A small Markdown renderer for the article reader.
 *
 * The articles are this plugin's own model output, and they are rendered as
 * React elements rather than injected HTML, so a model that emits a `<script>`
 * or an `onerror` attribute cannot turn into markup. Only the block and inline
 * forms the prompt actually asks for are supported: headings, paragraphs,
 * emphasis, inline code, fenced code, lists, quotes, links, and rules. Anything
 * else stays literal text, which is the safe failure for a reader.
 */

import * as React from 'react'

/** Matches one heading line. */
const HEADING = /^(#{1,6})\s+(.*)$/

/** Matches one fenced code opener. */
const FENCE = /^```(\S*)\s*$/

/** Matches a closing fence. */
const FENCE_CLOSE = /^```\s*$/

/** Matches a horizontal rule. */
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/

/** Matches one unordered-list item. */
const UNORDERED = /^\s*[-*+]\s+(.*)$/

/** Matches one ordered-list item. */
const ORDERED = /^\s*\d+[.)]\s+(.*)$/

/** Matches one blockquote line. */
const QUOTE = /^\s*>\s?(.*)$/

/** Inline forms, tried left to right at the current position. */
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)\s]+\))/g

/** Whether one line starts a block that ends the paragraph it is in. */
function startsBlock(line: string): boolean {
  return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || UNORDERED.test(line)
    || ORDERED.test(line) || QUOTE.test(line)
}

/** Render the emphasis, code, and link forms inside one line of text. */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  let index = 0
  INLINE.lastIndex = 0
  for (let match = INLINE.exec(text); match !== null; match = INLINE.exec(text)) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyBase}-${index}`
    index += 1
    if (token.startsWith('`')) {
      nodes.push(React.createElement('code', { key }, token.slice(1, -1)))
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(React.createElement('strong', { key }, token.slice(2, -2)))
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      const href = link?.[2] ?? ''
      // Only navigable schemes become links: a model-written `javascript:` URL
      // stays literal text instead of turning the article into a script.
      if (!/^(?:https?:\/\/|mailto:|\/|#)/i.test(href)) {
        nodes.push(token)
      } else {
        nodes.push(React.createElement(
          'a',
          { key, href, target: '_blank', rel: 'noreferrer noopener' },
          link?.[1] ?? token,
        ))
      }
    } else {
      nodes.push(React.createElement('em', { key }, token.slice(1, -1)))
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Split Markdown text into React block elements. */
function blocks(source: string): React.ReactNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const nodes: React.ReactNode[] = []
  let index = 0
  let key = 0

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      index += 1
      continue
    }

    const fence = FENCE.exec(line)
    if (fence !== null) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !FENCE_CLOSE.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      nodes.push(React.createElement(
        'pre',
        { key: `block-${key}` },
        React.createElement('code', fence[1] === '' ? null : { 'data-language': fence[1] }, code.join('\n')),
      ))
      key += 1
      continue
    }

    const heading = HEADING.exec(line)
    if (heading !== null) {
      nodes.push(React.createElement(
        `h${heading[1].length}`,
        { key: `block-${key}` },
        inline(heading[2], `heading-${key}`),
      ))
      key += 1
      index += 1
      continue
    }

    if (RULE.test(line)) {
      nodes.push(React.createElement('hr', { key: `block-${key}` }))
      key += 1
      index += 1
      continue
    }

    if (QUOTE.test(line)) {
      const quote: string[] = []
      while (index < lines.length) {
        const quoted = QUOTE.exec(lines[index])
        if (quoted === null) break
        quote.push(quoted[1])
        index += 1
      }
      nodes.push(React.createElement(
        'blockquote',
        { key: `block-${key}` },
        blocks(quote.join('\n')),
      ))
      key += 1
      continue
    }

    if (UNORDERED.test(line) || ORDERED.test(line)) {
      const ordered = ORDERED.test(line)
      const items: string[] = []
      while (index < lines.length) {
        const item = (ordered ? ORDERED : UNORDERED).exec(lines[index])
        if (item === null) break
        items.push(item[1])
        index += 1
      }
      nodes.push(React.createElement(
        ordered ? 'ol' : 'ul',
        { key: `block-${key}` },
        items.map((item, itemIndex) => React.createElement(
          'li',
          { key: `item-${key}-${itemIndex}` },
          inline(item, `item-${key}-${itemIndex}`),
        )),
      ))
      key += 1
      continue
    }

    const paragraph: string[] = []
    while (index < lines.length && lines[index].trim() !== '' && (paragraph.length === 0 || !startsBlock(lines[index]))) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    if (paragraph.length > 0) {
      nodes.push(React.createElement(
        'p',
        { key: `block-${key}` },
        inline(paragraph.join(' '), `paragraph-${key}`),
      ))
      key += 1
    }
  }

  return nodes
}

/**
 * Render one Markdown document.
 * @param props.text - the article body as stored on disk.
 * @returns the rendered block sequence.
 */
export function Markdown({ text }: { text: string }): React.ReactElement {
  return <div className="dsh-cd-md">{blocks(text)}</div>
}
