import { useState, useEffect } from 'react'
import { X, Send, CheckCircle, AlertCircle, Filter, Search } from 'lucide-react'
import { sendMessage } from '../services/telegramService'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'
import { getUsers } from '../services/dataService'
import CustomSelect from './CustomSelect'

const BroadcastModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('')
  const [selectedBots, setSelectedBots] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0, errors: [] })
  const [showResult, setShowResult] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [languageSearch, setLanguageSearch] = useState('')
  const [filters, setFilters] = useState(() => {
    // Загружаем сохраненные фильтры
    const saved = localStorage.getItem('botpanel_broadcast_filters')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error loading saved filters:', e)
      }
    }
    return {
      premium: '',
      languages: [],
      blocked: '',
    }
  })
  const { bots } = useBots()
  const { t } = useLanguage()

  // Получаем все уникальные языки из пользователей
  const getAllLanguages = () => {
    const allLanguages = new Set()
    bots.forEach(bot => {
      const botUsers = getUsers(bot.id)
      botUsers.forEach(u => {
        if (u.language_code) {
          allLanguages.add(u.language_code)
        }
      })
    })
    return Array.from(allLanguages).sort()
  }

  // Инициализируем языки - выбираем все по умолчанию при первом открытии
  useEffect(() => {
    if (isOpen) {
      const allLanguages = getAllLanguages()
      if (allLanguages.length > 0 && filters.languages.length === 0) {
        setFilters(prev => ({ ...prev, languages: allLanguages }))
      }
    }
  }, [isOpen])

  // Сохраняем фильтры при изменении
  useEffect(() => {
    localStorage.setItem('botpanel_broadcast_filters', JSON.stringify(filters))
  }, [filters])

  if (!isOpen) return null

  // Подсчитываем количество пользователей для рассылки
  const getRecipientsCount = () => {
    let total = 0
    selectedBots.forEach(botId => {
      const bot = bots.find(b => b.id === botId)
      if (bot) {
        let users = getUsers(botId).filter(u => !u.blocked)
        
        if (filters.premium === 'yes') {
          users = users.filter(u => u.is_premium)
        } else if (filters.premium === 'no') {
          users = users.filter(u => !u.is_premium)
        }
        
        if (filters.languages.length > 0) {
          users = users.filter(u => filters.languages.includes(u.language_code || 'ru'))
        }
        
        if (filters.blocked === 'not_blocked') {
          users = users.filter(u => !u.botBlocked)
        }
        
        total += users.length
      }
    })
    return total
  }

  const handleSend = async () => {
    if (!message.trim()) {
      alert(t('enterMessageText'))
      return
    }

    if (selectedBots.length === 0) {
      alert(t('selectAtLeastOneBot'))
      return
    }

    const recipientsCount = getRecipientsCount()
    if (recipientsCount === 0) {
      alert(t('noRecipients'))
      return
    }

    setShowConfirm(true)
  }

  const confirmSend = async () => {
    setShowConfirm(false)
    setSending(true)
    let sent = 0
    let failed = 0
    let total = 0
    const errors = []

    // Подсчитываем общее количество пользователей с учетом фильтров
    selectedBots.forEach(botId => {
      const bot = bots.find(b => b.id === botId)
      if (bot) {
        let users = getUsers(botId).filter(u => !u.blocked)
        
        // Применяем фильтры
        if (filters.premium === 'yes') {
          users = users.filter(u => u.is_premium)
        } else if (filters.premium === 'no') {
          users = users.filter(u => !u.is_premium)
        }
        
        if (filters.languages.length > 0) {
          users = users.filter(u => filters.languages.includes(u.language_code || 'ru'))
        }
        
        if (filters.blocked === 'not_blocked') {
          users = users.filter(u => !u.botBlocked)
        }
        
        total += users.length
      }
    })

    setProgress({ sent: 0, total, failed: 0, errors: [] })

    // Отправляем сообщения
    for (const botId of selectedBots) {
      const bot = bots.find(b => b.id === botId)
      if (!bot || !bot.token) continue

      let users = getUsers(botId).filter(u => !u.blocked)
      
      // Применяем фильтры
      if (filters.premium === 'yes') {
        users = users.filter(u => u.is_premium)
      } else if (filters.premium === 'no') {
        users = users.filter(u => !u.is_premium)
      }
      
      if (filters.languages.length > 0) {
        users = users.filter(u => filters.languages.includes(u.language_code || 'ru'))
      }
      
      if (filters.blocked === 'not_blocked') {
        users = users.filter(u => !u.botBlocked)
      }
      
      for (const user of users) {
        try {
          const result = await sendMessage(bot.token, user.id, message)
          if (result.success) {
            sent++
          } else {
            failed++
            errors.push({
              bot: bot.name,
              user: user.first_name || user.username || `ID: ${user.id}`,
              error: result.error || 'Неизвестная ошибка'
            })
          }
          setProgress({ sent, total, failed, errors: [...errors] })
          
          // Небольшая задержка, чтобы не перегрузить API
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          failed++
          errors.push({
            bot: bot.name,
            user: user.first_name || user.username || `ID: ${user.id}`,
            error: error.message || 'Ошибка отправки'
          })
          setProgress({ sent, total, failed, errors: [...errors] })
        }
      }
    }

    setSending(false)
    setShowResult(true)
  }

  const handleSendClick = () => {
    handleSend()
  }

  const toggleBot = (botId) => {
    if (selectedBots.includes(botId)) {
      setSelectedBots(selectedBots.filter(id => id !== botId))
    } else {
      setSelectedBots([...selectedBots, botId])
    }
  }

  const selectAllBots = () => {
    if (selectedBots.length === bots.length) {
      setSelectedBots([])
    } else {
      setSelectedBots(bots.map(b => b.id))
    }
  }

  const handleClose = () => {
    if (!sending) {
      setMessage('')
      setSelectedBots([])
      setProgress({ sent: 0, total: 0, failed: 0, errors: [] })
      setShowResult(false)
      setLanguageSearch('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">{t('broadcastMessage')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-100">{t('broadcastSettings')}</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{t('filter')}</span>
            </button>
          </div>

          {showFilters && (
            <div className="bg-dark-300 rounded-lg p-4 space-y-3 animate-slide-up">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('premium')}
                </label>
                <CustomSelect
                  value={filters.premium}
                  onChange={(value) => setFilters({ ...filters, premium: value })}
                  options={[
                    { value: '', label: t('all') },
                    { value: 'yes', label: t('yes') },
                    { value: 'no', label: t('no') },
                  ]}
                  placeholder={t('all')}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {t('language')}
                  </label>
                  <button
                    onClick={() => {
                      const allLanguages = getAllLanguages()
                      if (filters.languages.length === allLanguages.length) {
                        setFilters({ ...filters, languages: [] })
                      } else {
                        setFilters({ ...filters, languages: allLanguages })
                      }
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    {filters.languages.length === getAllLanguages().length ? t('deselectAll') : t('selectAll')}
                  </button>
                </div>
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder={t('searchLanguage')}
                      className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className={`space-y-2 bg-dark-200 rounded-lg p-2 ${
                  getAllLanguages().length >= 5 ? 'max-h-32 overflow-y-auto custom-scrollbar' : ''
                }`}>
                  {(() => {
                    const allLanguages = getAllLanguages()
                    const languageNames = {
                      'ru': 'Русский',
                      'en': 'English',
                      'uk': 'Українська',
                      'de': 'Deutsch',
                      'fr': 'Français',
                      'es': 'Español',
                      'it': 'Italiano',
                      'pt': 'Português',
                      'pl': 'Polski',
                      'tr': 'Türkçe',
                    }
                    
                    // Фильтруем по поиску
                    let filteredLanguages = allLanguages
                    if (languageSearch) {
                      const searchLower = languageSearch.toLowerCase()
                      filteredLanguages = allLanguages.filter(lang => {
                        const name = languageNames[lang] || lang.toUpperCase()
                        return name.toLowerCase().includes(searchLower) || lang.toLowerCase().includes(searchLower)
                      })
                    }
                    
                    return filteredLanguages.map(lang => (
                      <label key={lang} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-dark-300 rounded">
                        <input
                          type="checkbox"
                          checked={filters.languages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({ ...filters, languages: [...filters.languages, lang] })
                            } else {
                              setFilters({ ...filters, languages: filters.languages.filter(l => l !== lang) })
                            }
                          }}
                          className="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-300">
                          {languageNames[lang] || lang.toUpperCase()}
                        </span>
                      </label>
                    ))
                  })()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('blockingFilter')}
                </label>
                <CustomSelect
                  value={filters.blocked}
                  onChange={(value) => setFilters({ ...filters, blocked: value })}
                  options={[
                    { value: '', label: t('all') },
                    { value: 'not_blocked', label: t('notBlockedUsers') },
                  ]}
                  placeholder={t('all')}
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('selectBots')}
              </label>
              <button
                onClick={selectAllBots}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                {selectedBots.length === bots.length ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-dark-300 rounded-lg p-3 custom-scrollbar">
              {bots.map(bot => {
                let users = getUsers(bot.id).filter(u => !u.blocked)
                
                // Применяем фильтры для подсчета
                if (filters.premium === 'yes') {
                  users = users.filter(u => u.is_premium)
                } else if (filters.premium === 'no') {
                  users = users.filter(u => !u.is_premium)
                }
                
                if (filters.languages.length > 0) {
                  users = users.filter(u => filters.languages.includes(u.language_code || 'ru'))
                }
                
                if (filters.blocked === 'not_blocked') {
                  users = users.filter(u => !u.botBlocked)
                }

                return (
                  <label key={bot.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-dark-400 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedBots.includes(bot.id)}
                      onChange={() => toggleBot(bot.id)}
                      className="w-5 h-5 bg-dark-200 border-2 border-dark-400 rounded focus:ring-primary-500 checked:bg-primary-500 checked:border-primary-500"
                    />
                    <div className="flex-1">
                      <span className="text-gray-300 font-medium">{bot.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({users.length} {t('users')})
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder={t('enterMessage')}
              className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {sending && (
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">{t('sending')}</span>
                <span className="text-sm text-gray-400">
                  {progress.sent + progress.failed} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.total > 0 ? ((progress.sent + progress.failed) / progress.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{t('sent')}: {progress.sent}</span>
                <span>{t('failed')}: {progress.failed}</span>
              </div>
            </div>
          )}

          {showResult && !sending && (
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                {progress.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-primary-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-100">
                  {t('broadcastSuccess')}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('sent')}:</span>
                  <span className="text-primary-400 font-semibold">{progress.sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('failed')}:</span>
                  <span className="text-red-400 font-semibold">{progress.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('total')}:</span>
                  <span className="text-gray-300 font-semibold">{progress.total}</span>
                </div>
              </div>
              {progress.errors.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-2">{t('errors')}:</p>
                  <div className="space-y-1">
                    {progress.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                        <span className="font-medium">{error.bot}</span> - {error.user}: {error.error}
                      </div>
                    ))}
                    {progress.errors.length > 5 && (
                      <p className="text-xs text-gray-500">{t('andMoreErrors')} {progress.errors.length - 5}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">{t('confirmSend')}</h2>
              <div className="mb-6 space-y-3">
                <div className="bg-dark-300 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">{t('selectedBots')}:</span>
                    <span className="font-semibold text-gray-100">{selectedBots.length}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">{t('recipients')}:</span>
                    <span className="font-semibold text-primary-400">{getRecipientsCount()}</span>
                  </div>
                  {filters.premium && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">{t('premiumFilter')}:</span>
                      <span className="font-semibold text-gray-100">{filters.premium === 'yes' ? t('yes') : t('no')}</span>
                    </div>
                  )}
                  {filters.languages.length > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">{t('languages')}:</span>
                      <span className="font-semibold text-gray-100">{filters.languages.length}</span>
                    </div>
                  )}
                  {filters.blocked && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('blockingFilter')}:</span>
                      <span className="font-semibold text-gray-100">{t('notBlockedUsers')}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {t('confirmSendText')} <span className="font-semibold text-gray-300">{getRecipientsCount()}</span> {t('users')}?
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmSend}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 btn-glow btn-glow-primary"
                >
                  <Send className="h-4 w-4" />
                  <span>{t('confirm')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors disabled:opacity-50"
          >
            {showResult ? t('close') : t('cancel')}
          </button>
          {!showResult && (
            <button
              onClick={handleSendClick}
              disabled={sending || !message.trim() || selectedBots.length === 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 btn-glow btn-glow-primary"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? t('sending') : t('send')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BroadcastModal

