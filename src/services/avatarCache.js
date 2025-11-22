const AVATAR_CACHE_KEY = 'botpanel_avatar_cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000

const getCache = () => {
  try {
    const cached = localStorage.getItem(AVATAR_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('Error reading avatar cache:', e)
  }
  return {}
}

const saveCache = (cache) => {
  try {
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Error saving avatar cache:', e)
  }
}

export const getCachedAvatar = (key) => {
  const cache = getCache()
  const item = cache[key]
  
  if (item && item.url && item.timestamp) {
    const now = Date.now()
    if (now - item.timestamp < CACHE_EXPIRY) {
      return item.url
    } else {
      delete cache[key]
      saveCache(cache)
    }
  }
  
  return null
}

export const setCachedAvatar = (key, url) => {
  const cache = getCache()
  cache[key] = {
    url,
    timestamp: Date.now()
  }
  saveCache(cache)
}

export const clearAvatarCache = () => {
  localStorage.removeItem(AVATAR_CACHE_KEY)
}

export const cleanExpiredCache = () => {
  const cache = getCache()
  const now = Date.now()
  let cleaned = false
  
  Object.keys(cache).forEach(key => {
    const item = cache[key]
    if (item && item.timestamp && (now - item.timestamp >= CACHE_EXPIRY)) {
      delete cache[key]
      cleaned = true
    }
  })
  
  if (cleaned) {
    saveCache(cache)
  }
}

