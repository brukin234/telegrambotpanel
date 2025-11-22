/**
 * Кеш для аватарок пользователей и ботов
 */

const AVATAR_CACHE_KEY = 'botpanel_avatar_cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 дней

/**
 * Получить кеш аватарок
 */
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

/**
 * Сохранить кеш аватарок
 */
const saveCache = (cache) => {
  try {
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Error saving avatar cache:', e)
  }
}

/**
 * Получить аватар из кеша
 */
export const getCachedAvatar = (key) => {
  const cache = getCache()
  const item = cache[key]
  
  if (item && item.url && item.timestamp) {
    // Проверяем, не истек ли кеш
    const now = Date.now()
    if (now - item.timestamp < CACHE_EXPIRY) {
      return item.url
    } else {
      // Удаляем устаревший элемент
      delete cache[key]
      saveCache(cache)
    }
  }
  
  return null
}

/**
 * Сохранить аватар в кеш
 */
export const setCachedAvatar = (key, url) => {
  const cache = getCache()
  cache[key] = {
    url,
    timestamp: Date.now()
  }
  saveCache(cache)
}

/**
 * Очистить кеш
 */
export const clearAvatarCache = () => {
  localStorage.removeItem(AVATAR_CACHE_KEY)
}

/**
 * Очистить устаревшие записи из кеша
 */
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

