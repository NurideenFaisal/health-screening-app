import { hydrateAuthSession } from './hydrateAuthSession'

export async function loadSession(sessionOverride) {
  return hydrateAuthSession(sessionOverride)
}
