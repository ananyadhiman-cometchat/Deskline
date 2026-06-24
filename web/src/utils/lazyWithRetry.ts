import { lazy, type ComponentType } from 'react'

/**
 * A wrapper around React.lazy that handles chunk-load failures from stale deployments.
 * When a dynamic import fails (e.g. hashed chunk no longer exists after a redeploy),
 * it reloads the page once to fetch the latest index.html with correct chunk references.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const storageKey = 'chunk-reload-attempted'

    try {
      const component = await factory()
      // Reset the flag on success so future failures still trigger a reload
      sessionStorage.removeItem(storageKey)
      return component
    } catch (error) {
      // Only attempt one reload per session to avoid infinite reload loops
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1')
        window.location.reload()
      }
      throw error
    }
  })
}
