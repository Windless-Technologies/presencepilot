import { initBotId } from 'botid/client/core'

// Vercel BotID runs an invisible challenge in the browser and attaches its
// result to these requests, so the server can check it (src/lib/bot.ts).
// Every path that accepts a visitor's submission must be listed here, and
// its route must call isConfirmedHuman() before doing anything else.
initBotId({
  protect: [
    // Starting a Google, GitHub or LinkedIn sign-in (NextAuth's signIn()).
    { path: '/api/auth/signin/*', method: 'POST' }
  ]
})
