export function isProduction(): boolean {
  if (process.env.APP_ENV) {
    return process.env.APP_ENV === 'production'
  }
  // Fall back to NODE_ENV
  return process.env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  if (process.env.APP_ENV) {
    return process.env.APP_ENV === 'development'
  }
  return process.env.NODE_ENV === 'development'
}

export function getApiEndpoint(type: 'fetch' | 'save'): string {
  if (isProduction()) {
    return type === 'fetch' ? '/api/fetch-file' : '/api/commit'
  }
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost) {
      return type === 'fetch' ? '/api/fetch-local' : '/api/save-local'
    }
  }
  return type === 'fetch' ? '/api/fetch-file' : '/api/commit'
}

