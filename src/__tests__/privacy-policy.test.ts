/**
 * @jest-environment node
 */
// The privacy policy must name every processor the data inventory lists
// (engineering standards, sections 10 and 13), so the two cannot drift.
import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..', '..')
const inventory = readFileSync(join(root, 'docs', 'DATA_INVENTORY.md'), 'utf8')
const policy = readFileSync(
  join(root, 'src', 'app', 'privacy', 'page.tsx'),
  'utf8'
)

/** First-column names in the inventory's processors table. */
function processors(): string[] {
  const section =
    inventory.split('## Processors and international transfers')[1] ?? ''
  const table = section.split('\n## ')[0] ?? ''
  return table
    .split('\n')
    .filter(
      (line) => line.startsWith('| ') && !/^\| (Processor|---)/.test(line)
    )
    .map((line) => line.split('|')[1]!.trim())
    .map((cell) => cell.replace(/\s*\(.*\)\s*$/, '').trim())
}

describe('privacy policy', () => {
  it('reads processors from the inventory', () => {
    expect(processors()).toEqual(
      expect.arrayContaining([
        'Google',
        'GitHub',
        'LinkedIn',
        'Sentry',
        'Vercel'
      ])
    )
  })

  it.each(processors())('names %s', (name) => {
    expect(policy).toContain(name)
  })

  it('gives the privacy contact the inventory names', () => {
    expect(inventory).toContain('hr@bravehaven.io')
    expect(policy).toContain('hr@bravehaven.io')
  })
})
