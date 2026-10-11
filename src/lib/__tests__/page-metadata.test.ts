/**
 * @jest-environment node
 */
// Every page has a unique title under 60 characters and a unique description
// under 160, and every shareable page builds its share card from them
// (COPY_AND_CONVERSION_STANDARDS.md Section 12).
import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DESCRIPTION_MAX,
  PAGES,
  TITLE_MAX,
  pageMetadata
} from '../page-metadata'

const app = join(__dirname, '..', '..', 'app')
const entries = Object.entries(PAGES)

// Where each page's metadata is exported.
const FILES: Record<keyof typeof PAGES, string> = {
  home: 'page.tsx',
  login: 'login/page.tsx',
  onboarding: 'onboarding/layout.tsx',
  privacy: 'privacy/page.tsx',
  terms: 'terms/page.tsx',
  accessibility: 'accessibility/page.tsx'
}

describe('page metadata', () => {
  it.each(entries)('%s has a title under 60 characters', (_, { title }) => {
    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThan(TITLE_MAX)
  })

  it.each(entries)(
    '%s has a description under 160 characters',
    (_, { description }) => {
      expect(description.length).toBeGreaterThan(0)
      expect(description.length).toBeLessThan(DESCRIPTION_MAX)
    }
  )

  it('gives no two pages the same title or description', () => {
    const titles = entries.map(([, p]) => p.title)
    const descriptions = entries.map(([, p]) => p.description)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it('copies the title and description into the Open Graph and Twitter cards', () => {
    const meta = pageMetadata(PAGES.home)
    expect(meta.openGraph).toMatchObject({
      title: PAGES.home.title,
      description: PAGES.home.description,
      siteName: 'PresencePilot'
    })
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      title: PAGES.home.title,
      description: PAGES.home.description
    })
  })

  it.each(Object.entries(FILES))('%s exports its own entry', (name, file) => {
    const source = readFileSync(join(app, file), 'utf8')
    expect(source).toContain(`pageMetadata(PAGES.${name})`)
  })
})
