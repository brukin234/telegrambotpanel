import { useState, useMemo, useEffect } from 'react'
import Header from '../components/Header'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'
import { getUsers } from '../services/dataService'
import UserDialog from '../components/UserDialog'
import UserFilters from '../components/UserFilters'
import BroadcastModal from '../components/BroadcastModal'
import { getUserProfilePhotos } from '../services/telegramService'
import { Search, Filter, MessageSquare, Calendar, User, Mail, X, CheckCircle, Ban, Loader, AlertCircle } from 'lucide-react'
import { getUsers as getUsersService } from '../services/dataService'
import { checkUserBlocked, deleteTelegramMessage } from '../services/telegramService'

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedBotId, setSelectedBotId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [filters, setFilters] = useState({
    bot: '',
    gender: '',
    premium: '',
    blocked: '',
    dateFrom: '',
    dateTo: '',
  })
  const [userAvatars, setUserAvatars] = useState({})
  const [checkingBlocked, setCheckingBlocked] = useState({})
  const [notifications, setNotifications] = useState([])
  const [showBlockCheckWarning, setShowBlockCheckWarning] = useState(null)
  const [dontShowWarning, setDontShowWarning] = useState(localStorage.getItem('botpanel_dont_show_block_warning') === 'true')
  const [usersKey, setUsersKey] = useState(0) // Для принудительного обновления
  const { bots } = useBots()
  const { t } = useLanguage()

  // Добавляем уведомление
  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const [showBlockConfirm, setShowBlockConfirm] = useState(null)

  const handleBlockUser = (user) => {
    setShowBlockConfirm(user)
  }

  const confirmBlockUser = async (user) => {
    const bot = bots.find(b => b.id === user.botId)
    if (!bot) return

    const users = getUsersService(user.botId)
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, blocked: !u.blocked } : u
    )
    localStorage.setItem(`botpanel_users_${user.botId}`, JSON.stringify(updatedUsers))
    setShowBlockConfirm(null)
    
    // Обновляем состояние без перезагрузки
    const updatedUser = updatedUsers.find(u => u.id === user.id)
    if (updatedUser) {
      addNotification(
        updatedUser.blocked 
          ? `${user.first_name || user.username || 'Пользователь'} заблокирован`
          : `${user.first_name || user.username || 'Пользователь'} разблокирован`,
        updatedUser.blocked ? 'warning' : 'success'
      )
      setUsersKey(prev => prev + 1) // Принудительно обновляем список пользователей
    }
  }

  const handleCheckBlocked = (user) => {
    if (!dontShowWarning) {
      setShowBlockCheckWarning(user)
      return
    }
    performCheckBlocked(user)
  }

  const performCheckBlocked = async (user) => {
    const bot = bots.find(b => b.id === user.botId)
    if (!bot || !bot.token) return

    setCheckingBlocked(prev => ({ ...prev, [user.id]: true }))
    setShowBlockCheckWarning(null)
    
    try {
      const result = await checkUserBlocked(bot.token, user.id)
      if (result.success) {
        // Удаляем тестовое сообщение после проверки
        if (result.messageId && result.chatId) {
          try {
            await deleteTelegramMessage(bot.token, result.chatId, result.messageId)
          } catch (error) {
            console.error('Error deleting test message:', error)
            // Не показываем ошибку пользователю, так как проверка уже выполнена
          }
        }
        
        const users = getUsersService(user.botId)
        const updatedUsers = users.map(u => 
          u.id === user.id ? { ...u, botBlocked: result.blocked } : u
        )
        localStorage.setItem(`botpanel_users_${user.botId}`, JSON.stringify(updatedUsers))
        
        if (result.blocked) {
          addNotification(`${user.first_name || user.username || 'Пользователь'} заблокировал бота`, 'warning')
        } else {
          addNotification(`${user.first_name || user.username || 'Пользователь'} не заблокировал бота`, 'success')
        }
        
        // Обновляем состояние без перезагрузки
        setUsersKey(prev => prev + 1) // Принудительно обновляем список пользователей
      } else {
        addNotification(`Ошибка проверки: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Error checking blocked status:', error)
      addNotification(`Ошибка: ${error.message}`, 'error')
    } finally {
      setCheckingBlocked(prev => ({ ...prev, [user.id]: false }))
    }
  }


  // Получаем всех пользователей из всех ботов
  const users = useMemo(() => {
    const allUsers = []
    bots.forEach(bot => {
      const botUsers = getUsers(bot.id)
      botUsers.forEach(user => {
        allUsers.push({
          ...user,
          botId: bot.id,
          botName: bot.name,
        })
      })
    })
    return allUsers
  }, [bots, usersKey])

  // Загружаем аватарки пользователей
  useEffect(() => {
    users.forEach(user => {
      if (!userAvatars[user.id] && user.botId) {
        const bot = bots.find(b => b.id === user.botId)
        if (bot?.token) {
          getUserProfilePhotos(bot.token, user.id).then(result => {
            if (result.success) {
              setUserAvatars(prev => ({ ...prev, [user.id]: result.photoUrl }))
            }
          })
        }
      }
    })
  }, [users, bots])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Поиск
      const name = user.first_name || user.username || ''
      const username = user.username || ''
      const query = searchQuery.toLowerCase()
      const matchesSearch = name.toLowerCase().includes(query) || username.toLowerCase().includes(query)
      
      // Фильтры
      const matchesBot = !filters.bot || user.botId === filters.bot
      const matchesGender = !filters.gender || user.gender === filters.gender
      const matchesPremium = !filters.premium || (filters.premium === 'yes' ? user.is_premium : !user.is_premium)
      const matchesBlocked = !filters.blocked || (filters.blocked === 'blocked' ? user.blocked : filters.blocked === 'not_blocked' ? !user.blocked : true)
      
      let matchesDate = true
      if (filters.dateFrom || filters.dateTo) {
        const activityDate = user.lastSeen ? new Date(user.lastSeen) : (user.firstSeen ? new Date(user.firstSeen) : null)
        if (filters.dateFrom && activityDate) {
          const dateFrom = new Date(filters.dateFrom)
          dateFrom.setHours(0, 0, 0, 0)
          if (activityDate < dateFrom) matchesDate = false
        }
        if (filters.dateTo && activityDate) {
          const dateTo = new Date(filters.dateTo)
          dateTo.setHours(23, 59, 59, 999)
          if (activityDate > dateTo) matchesDate = false
        }
      }
      
      return matchesSearch && matchesBot && matchesGender && matchesPremium && matchesBlocked && matchesDate
    })
  }, [users, searchQuery, filters])

  return (
    <div className="min-h-screen bg-dark-50 page-transition">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('usersTitle')}</h1>
            <p className="text-gray-400">{t('userList')}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors flex items-center space-x-2 text-gray-300"
            >
              <Filter className="h-5 w-5" />
              <span>{t('filter')}</span>
            </button>
            <button
              onClick={() => setShowBroadcast(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 btn-glow btn-glow-primary"
            >
              <Mail className="h-5 w-5" />
              <span>{t('broadcast')}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-dark-300 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Filters */}
        {(filters.bot || filters.gender || filters.premium || filters.blocked || filters.dateFrom || filters.dateTo) && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-400">{t('activeFilters')}:</span>
            {filters.bot && (
              <span className="px-3 py-1 bg-primary-900/50 text-primary-300 rounded-full text-sm flex items-center space-x-2">
                <span>{t('botFilter')}: {bots.find(b => b.id === filters.bot)?.name || filters.bot}</span>
                <button onClick={() => setFilters({ ...filters, bot: '' })} className="hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.gender && (
              <span className="px-3 py-1 bg-primary-900/50 text-primary-300 rounded-full text-sm flex items-center space-x-2">
                <span>{t('genderFilter')}: {filters.gender === 'male' ? t('male') : t('female')}</span>
                <button onClick={() => setFilters({ ...filters, gender: '' })} className="hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.premium && (
              <span className="px-3 py-1 bg-primary-900/50 text-primary-300 rounded-full text-sm flex items-center space-x-2">
                <span>{t('premiumFilter')}: {filters.premium === 'yes' ? t('yes') : t('no')}</span>
                <button onClick={() => setFilters({ ...filters, premium: '' })} className="hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.blocked && (
              <span className="px-3 py-1 bg-primary-900/50 text-primary-300 rounded-full text-sm flex items-center space-x-2">
                <span>{t('blockingFilter')}: {filters.blocked === 'blocked' ? t('blockedUsers') : t('notBlockedUsers')}</span>
                <button onClick={() => setFilters({ ...filters, blocked: '' })} className="hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="px-3 py-1 bg-primary-900/50 text-primary-300 rounded-full text-sm flex items-center space-x-2">
                <span>{t('dateFilter')}: {filters.dateFrom || '...'} - {filters.dateTo || '...'}</span>
                <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })} className="hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Users Count */}
        {filteredUsers.length > 0 && (
          <div className="mb-4 text-sm text-gray-400">
            {t('shown')} <span className="font-medium text-gray-300">1</span> - <span className="font-medium text-gray-300">{filteredUsers.length}</span> {t('of')}{' '}
            <span className="font-medium text-gray-300">{filteredUsers.length}</span> {t('usersCountText')}
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-12 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              {t('noUsersText')}
            </h3>
            <p className="text-gray-400">
              {t('noUsersDescription')}
            </p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-300">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('user')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('language')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('premium')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('lastActivity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-200 divide-y divide-dark-300">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-dark-300">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
            {userAvatars[user.id] ? (
              <img
                src={userAvatars[user.id]}
                alt={user.first_name || user.username}
                className="w-10 h-10 rounded-full mr-3"
                onError={() => {
                  setUserAvatars(prev => {
                    const newAvatars = { ...prev }
                    delete newAvatars[user.id]
                    return newAvatars
                  })
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-primary-900/50 rounded-full flex items-center justify-center mr-3">
                {user.first_name || user.username ? (
                  <span className="text-primary-400 font-semibold text-sm">
                    {(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-5 w-5 text-primary-400" />
                )}
              </div>
            )}
                            <div>
                              <div className="text-sm font-medium text-gray-100">
                                {user.first_name || user.username || `ID: ${user.id}`}
                              </div>
                              <div className="text-sm text-gray-400">
                                {user.username ? `@${user.username}` : user.botName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-dark-300 text-gray-300">
                            {(user.language_code || 'ru').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_premium ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-400">
                              {t('yes')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-dark-300 text-gray-400">
                              {t('no')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {user.blocked && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-400 w-fit">
                                {t('blocked')}
                              </span>
                            )}
                            {user.botBlocked && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-900/50 text-orange-400 w-fit">
                                {t('blockedBot')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {user.lastSeen 
                              ? new Date(user.lastSeen).toLocaleString(t('language') === 'en' ? 'en-US' : 'ru-RU', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setSelectedBotId(user.botId)
                              }}
                              className="text-primary-400 hover:text-primary-300 transition-colors" title={t('chat')}
                              disabled={user.blocked}
                            >
                              <MessageSquare className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleBlockUser(user)}
                              className={user.blocked ? "text-green-400 hover:text-green-300 transition-colors" : "text-red-400 hover:text-red-300 transition-colors"}
                              title={user.blocked ? t('unblock') : t('block')}
                            >
                              {user.blocked ? <CheckCircle className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => handleCheckBlocked(user)}
                              disabled={checkingBlocked[user.id]}
                              className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                              title={t('checkBlock')}
                            >
                              {checkingBlocked[user.id] ? (
                                <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Loader className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}

        {/* User Dialog */}
        {selectedUser && (
          <UserDialog
            user={selectedUser}
            botId={selectedBotId}
            onClose={() => {
              setSelectedUser(null)
              setSelectedBotId(null)
            }}
          />
        )}

        {/* Filters Modal */}
        <UserFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => setFilters(newFilters)}
          filters={filters}
        />

        {/* Broadcast Modal */}
        <BroadcastModal
          isOpen={showBroadcast}
          onClose={() => setShowBroadcast(false)}
        />

        {/* Block User Confirmation Modal */}
        {showBlockConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                {showBlockConfirm.blocked ? t('unblockUser') : t('blockUser')}
              </h2>
              <p className="text-gray-400 mb-6">
                {t('confirmBlockText')} <span className="font-semibold text-gray-300">
                  {showBlockConfirm.first_name || showBlockConfirm.username || `ID: ${showBlockConfirm.id}`}
                </span> {t('confirmBlockUser')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => confirmBlockUser(showBlockConfirm)}
                  className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                    showBlockConfirm.blocked
                      ? 'bg-primary-600 text-white hover:bg-primary-700 btn-glow btn-glow-primary'
                      : 'bg-red-600 text-white hover:bg-red-700 btn-glow btn-glow-red'
                  }`}
                >
                  {showBlockConfirm.blocked ? t('unblock') : t('block')}
                </button>
                <button
                  onClick={() => setShowBlockConfirm(null)}
                  className="px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block Check Warning Modal */}
        {showBlockCheckWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">{t('warning')}</h2>
              <p className="text-gray-400 mb-4">
                {t('checkBlockWarning')}
              </p>
              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowWarning}
                    onChange={(e) => {
                      setDontShowWarning(e.target.checked)
                      localStorage.setItem('botpanel_dont_show_block_warning', e.target.checked.toString())
                    }}
                    className="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">{t('dontShowAgain')}</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => performCheckBlocked(showBlockCheckWarning)}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary"
                >
                  {t('continue')}
                </button>
                <button
                  onClick={() => setShowBlockCheckWarning(null)}
                  className="px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-dark-200 border border-dark-300 rounded-lg shadow-xl p-4 min-w-[300px] max-w-md animate-slide-in ${
                notification.type === 'success' ? 'border-primary-500' :
                notification.type === 'error' ? 'border-red-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                'border-dark-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />}
                {notification.type === 'error' && <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />}
                {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                <p className="text-sm text-gray-300 flex-1">{notification.message}</p>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Users

