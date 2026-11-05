/**
 * Read receipts for the article list.
 *
 * The Markdown files stay the source of truth for what an article says; whether
 * the reader has opened one is separate local state, kept in a small JSON map
 * beside the settings so replacing or deleting an article never touches it.
 * Writes are read-modify-write followed by an atomic rename: the file is tiny
 * and this plugin is its only writer.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { readsPath } from './paths.js'

/** The stored shape: article id to the instant it was first opened. */
type ReadMap = Record<string, string>

/** Load the map, treating a missing or malformed file as "nothing read yet". */
async function loadReads(): Promise<ReadMap> {
  try {
    const parsed: unknown = JSON.parse(await readFile(readsPath(), 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const reads: ReadMap = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') reads[id] = value
    }
    return reads
  } catch {
    return {}
  }
}

/** Every article id the reader has already opened. */
export async function readIds(): Promise<Set<string>> {
  return new Set(Object.keys(await loadReads()))
}

/** Whether one article has been opened. */
export async function isRead(id: string): Promise<boolean> {
  return Object.hasOwn(await loadReads(), id)
}

/** Drop one article's receipt, so a deleted article leaves no trace behind. */
export async function forgetRead(id: string): Promise<void> {
  const reads = await loadReads()
  if (!Object.hasOwn(reads, id)) return
  delete reads[id]
  await writeReads(reads)
}

/** Record that one article was opened, keeping the first receipt it had. */
export async function markRead(id: string): Promise<void> {
  const reads = await loadReads()
  if (Object.hasOwn(reads, id)) return
  reads[id] = new Date().toISOString()
  await writeReads(reads)
}

/** Write the map through a sibling temporary file and a rename. */
async function writeReads(reads: ReadMap): Promise<void> {
  const file = readsPath()
  await mkdir(dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(reads, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
}
