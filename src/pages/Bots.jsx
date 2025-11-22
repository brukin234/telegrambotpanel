import { useState, useEffect } from 'react'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import { getBotInfo, syncBotData, getBotProfilePhoto } from '../services/telegramService'
import { Plus, Bot, Trash2, Edit, Check, X, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const Bots = () => {
  const { bots, addBot, deleteBot, updateBot } = useBots()
  const { t } = useLanguage()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBot, setEditingBot] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    token: '',
  })
  const [verifying, setVerifying] = useState(false)
  const [syncing, setSyncing] = useState({})
  const [botInfo, setBotInfo] = useState(null)
  const [verifyError, setVerifyError] = useState('')
  const [botAvatars, setBotAvatars] = useState({})

  // Загружаем аватарки ботов
  useEffect(() => {
    bots.forEach(bot => {
      if (!botAvatars[bot.id] && bot.token && bot.status === 'active') {
        getBotProfilePhoto(bot.token).then(result => {
          if (result.success) {
            setBotAvatars(prev => ({ ...prev, [bot.id]: result.photoUrl }))
          }
        })
      }
    })
  }, [bots])

  const handleAddBot = async () => {
    if (!formData.name || !formData.token) {
      alert(t('fillNameToken'))
      return
    }

    const newBot = addBot({
      name: formData.name,
      token: formData.token,
      username: botInfo?.username || '',
      status: 'active',
    })

    setFormData({ name: '', token: '' })
    setShowAddModal(false)
    setBotInfo(null)
    setVerifyError('')

    // Автоматически синхронизируем данные после добавления бота
    if (formData.token) {
      setTimeout(async () => {
        const result = await syncBotData(newBot.id, formData.token)
        if (result.success) {
          window.location.reload()
        }
      }, 500)
    }
  }

  const handleEditBot = (bot) => {
    setEditingBot(bot)
    setFormData({
      name: bot.name,
      token: bot.token,
    })
    setShowAddModal(true)
  }

  const handleUpdateBot = () => {
    if (!formData.name || !formData.token) {
      alert(t('fillRequired'))
      return
    }

    updateBot(editingBot.id, {
      name: formData.name,
      token: formData.token,
      username: botInfo?.username || editingBot.username,
    })

    setEditingBot(null)
    setFormData({ name: '', token: '' })
    setShowAddModal(false)
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  const handleDeleteBot = (id) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = (id) => {
    deleteBot(id)
    setShowDeleteConfirm(null)
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setEditingBot(null)
    setFormData({ name: '', token: '' })
    setBotInfo(null)
    setVerifyError('')
  }

  const handleVerifyToken = async () => {
    if (!formData.token) {
      setVerifyError('Введите токен бота')
      return
    }

    setVerifying(true)
    setVerifyError('')
    setBotInfo(null)

    try {
      const result = await getBotInfo(formData.token)
      
      if (result.success) {
        setBotInfo(result.bot)
        setFormData(prev => ({
          ...prev,
          name: result.bot.first_name || prev.name,
          username: result.bot.username || prev.username,
        }))
        setVerifyError('')
      } else {
        setVerifyError(result.error || 'Неверный токен бота')
        setBotInfo(null)
      }
    } catch (error) {
      setVerifyError('Ошибка при проверке токена')
      setBotInfo(null)
    } finally {
      setVerifying(false)
    }
  }

  const handleSyncBot = async (bot) => {
    if (!bot.token) {
      setSyncResult({
        success: false,
        error: 'У бота нет токена'
      })
      return
    }

    setSyncing(prev => ({ ...prev, [bot.id]: true }))

    try {
      const result = await syncBotData(bot.id, bot.token)
      
      if (result.success) {
        setSyncResult({
          success: true,
          processed: result.processed || 0,
          total: result.total || 0,
          botName: bot.name
        })
        // Обновляем статистику без перезагрузки страницы
        // Статистика обновится автоматически через BotsContext
      } else {
        setSyncResult({
          success: false,
          error: result.error || 'Ошибка синхронизации'
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error.message || 'Неизвестная ошибка'
      })
    } finally {
      setSyncing(prev => ({ ...prev, [bot.id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-dark-50 page-transition">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('botsTitle')}</h1>
            <p className="text-gray-400">{t('manageBots')}</p>
          </div>
          <div className="flex items-center space-x-3">
            {bots.length > 0 && (
              <button
                onClick={async () => {
                  setSyncing({})
                  for (const bot of bots) {
                    if (bot.token) {
                      setSyncing(prev => ({ ...prev, [bot.id]: true }))
                      try {
                        await syncBotData(bot.id, bot.token)
                      } catch (error) {
                        console.error(`Error syncing bot ${bot.name}:`, error)
                      } finally {
                        setSyncing(prev => ({ ...prev, [bot.id]: false }))
                      }
                    }
                  }
                  setSyncResult({
                    success: true,
                    processed: 0,
                    total: 0,
                    botName: t('allBots')
                  })
                }}
                disabled={Object.values(syncing).some(v => v)}
                className="px-6 py-3 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-5 w-5 ${Object.values(syncing).some(v => v) ? 'animate-spin' : ''}`} />
                <span>{t('syncAllBots')}</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 btn-glow btn-glow-primary"
            >
              <Plus className="h-5 w-5" />
              <span>{t('addBot')}</span>
            </button>
          </div>
        </div>

        {bots.length === 0 ? (
          <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-12 text-center">
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              {t('noBots')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('noBotsText')}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2 btn-glow btn-glow-primary"
            >
              <Plus className="h-5 w-5" />
              <span>{t('addBot')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {botAvatars[bot.id] ? (
                        <img
                          src={botAvatars[bot.id]}
                          alt={bot.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={() => {
                            setBotAvatars(prev => {
                              const newAvatars = { ...prev }
                              delete newAvatars[bot.id]
                              return newAvatars
                            })
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-900/50 rounded-lg flex items-center justify-center">
                          <Bot className="h-6 w-6 text-primary-400" />
                        </div>
                      )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">{bot.name}</h3>
                      {bot.username && (
                        <p className="text-sm text-gray-400">@{bot.username}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      bot.status === 'active'
                        ? 'bg-primary-900/50 text-primary-400'
                        : 'bg-dark-300 text-gray-400'
                    }`}
                  >
                    {bot.status === 'active' ? t('active') : t('inactive')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-400">{t('usersCount')}:</span>{' '}
                    <span className="font-semibold text-gray-100">
                      {bot.stats?.totalUsers || 0}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">{t('messages')}:</span>{' '}
                    <span className="font-semibold text-gray-100">
                      {bot.stats?.totalEvents || 0}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEditBot(bot)}
                    className="flex-1 px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{t('edit')}</span>
                  </button>
                  {bot.token && (
                    <button
                      onClick={() => handleSyncBot(bot)}
                      disabled={syncing[bot.id]}
                      className="flex-1 px-4 py-2 bg-primary-900/50 text-primary-400 rounded-lg hover:bg-primary-800/50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      title={t('syncBot')}
                    >
                      {syncing[bot.id] ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{t('syncBot')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="flex-1 px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('delete')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal для добавления/редактирования бота */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">
                {editingBot ? t('editBotTitle') : t('addBotTitle')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('botName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('botName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('botToken')} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.token}
                      onChange={(e) => {
                        setFormData({ ...formData, token: e.target.value })
                        setBotInfo(null)
                        setVerifyError('')
                      }}
                      className="flex-1 px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyToken}
                      disabled={verifying || !formData.token}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {verifying ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{t('verify')}</span>
                    </button>
                  </div>
                  {botInfo && (
                    <div className="mt-2 p-3 bg-primary-900/30 border border-primary-700/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-primary-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('botFound')}: @{botInfo.username || t('noUsername')}</span>
                      </div>
                    </div>
                  )}
                  {verifyError && (
                    <div className="mt-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{verifyError}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {t('getTokenFromBotFather')}
                  </p>
                </div>

              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingBot ? handleUpdateBot : handleAddBot}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 btn-glow btn-glow-primary"
                >
                  <Check className="h-5 w-5" />
                  <span>{editingBot ? t('save') : t('add')}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>{t('cancel')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">{t('confirmDelete')}</h2>
              <p className="text-gray-400 mb-6">
                {t('confirmDeleteText')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => confirmDelete(showDeleteConfirm)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 btn-glow btn-glow-red"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>{t('delete')}</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Result Modal */}
        {syncResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              {syncResult.success ? (
                <>
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-900/50 rounded-full mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-primary-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100 mb-2 text-center">{t('syncSuccess')}!</h2>
                  <p className="text-gray-400 mb-4 text-center">
                    {t('bot')} <span className="font-semibold text-gray-300">{syncResult.botName}</span> {t('successfullySynced')}
                  </p>
                  <div className="bg-dark-300 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">{t('processedEvents')}:</span>
                      <span className="font-semibold text-primary-400">{syncResult.processed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('totalUpdates')}:</span>
                      <span className="font-semibold text-gray-300">{syncResult.total}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSyncResult(null)}
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary"
                  >
                    {t('close')}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-16 h-16 bg-red-900/50 rounded-full mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100 mb-2 text-center">{t('syncError')}</h2>
                  <p className="text-gray-400 mb-6 text-center">
                    {syncResult.error}
                  </p>
                  <button
                    onClick={() => setSyncResult(null)}
                    className="w-full px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
                  >
                    {t('close')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Bots

