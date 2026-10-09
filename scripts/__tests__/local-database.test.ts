/**
 * @jest-environment node
 */
import { describe, expect, it } from '@jest/globals'
import { localDatabase } from '../local-database'

// Built from parts so no connection string with a password sits in the repo.
const url = (host: string, rest = '/presencepilot') =>
  ['postgresql:', '', host].join('/') + rest

describe('localDatabase', () => {
  it('accepts a database on this machine', () => {
    expect(localDatabase(url('localhost'), {})).toEqual({
      name: 'presencepilot',
      args: ['--host', 'localhost']
    })
    expect(localDatabase(url('127.0.0.1:5433', '/pp_test'), {})).toEqual({
      name: 'pp_test',
      args: ['--host', '127.0.0.1', '--port', '5433']
    })
    expect(localDatabase(url('[::1]'), {}).args).toEqual(['--host', '::1'])
  })

  it('attack: refuses a remote database, so production is never dropped or seeded', () => {
    for (const host of [
      'db.example.com',
      'ep-cool-name.us-east-2.aws.neon.tech',
      '10.0.0.5',
      'localhost.example.com'
    ]) {
      expect(() => localDatabase(url(host), {})).toThrow(/remote host/)
    }
  })

  it('attack: refuses to run on any Vercel deployment, even against localhost', () => {
    expect(() =>
      localDatabase(url('localhost'), { VERCEL_ENV: 'preview' })
    ).toThrow(/Vercel/)
    expect(() => localDatabase(url('localhost'), { VERCEL: '1' })).toThrow(
      /Vercel/
    )
  })

  it('attack: refuses a database name that could become a command or an option', () => {
    for (const rest of [
      '/presencepilot;rm%20-rf%20~',
      '/%24(whoami)',
      '/--help',
      '/',
      '/a%20b'
    ]) {
      expect(() => localDatabase(url('localhost', rest), {})).toThrow(
        /plain database name/
      )
    }
  })

  it('treats a blank DATABASE_URL as unset and never echoes the URL', () => {
    expect(() => localDatabase('  ', {})).toThrow(/not set/)
    const withPassword = url('user:not-a-real-value@db.example.com')
    try {
      localDatabase(withPassword, {})
    } catch (e) {
      expect((e as Error).message).not.toContain('not-a-real-value')
    }
    expect(() => localDatabase('mysql://localhost/x', {})).toThrow(/postgres/)
  })
})
