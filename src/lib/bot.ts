import { checkBotId } from 'botid/server'
import { cookies } from 'next/headers'

// Vercel BotID on every form a visitor submits (engineering standards,
// section 1). A request is accepted only when BotID says it is not a bot;
// any failure to check counts as "not confirmed", so the check fails closed.
//
// Local test mode exists only so the browser tests, which run a production
// build on a laptop or CI runner, can choose BotID's verdict with a cookie.
// It can never switch on in a Vercel deployment.
export function localTestMode(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.BOTID_LOCAL_TEST === '1' && !env.VERCEL && !env.VERCEL_ENV
}

export async function isConfirmedHuman(): Promise<boolean> {
  try {
    if (localTestMode()) {
      const verdict =
        (await cookies()).get('botid-test')?.value === 'bot'
          ? 'BAD-BOT'
          : 'HUMAN'
      const result = await checkBotId({
        developmentOptions: { isDevelopment: true, bypass: verdict }
      })
      return !result.isBot
    }
    const result = await checkBotId()
    return !result.isBot
  } catch (error) {
    // The error's name only: never the request or anything personal.
    console.error(
      'BotID check failed',
      error instanceof Error ? error.name : 'unknown'
    )
    return false
  }
}
