import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, User, RefreshCw, Trash2 } from 'lucide-react'
import { getEvents, addEvent, deleteEvent } from '../services/dataService'
import { sendMessage, getUserProfilePhotos, syncBotData, deleteTelegramMessage, isDemoToken } from '../services/telegramService'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'

const UserDialog = ({ user, botId, onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [userAvatar, setUserAvatar] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const messagesEndRef = useRef(null)
  const previousMessageCount = useRef(0)
  const { bots } = useBots()
  const { t } = useLanguage()

  const bot = bots.find(b => b.id === botId)
  const botToken = bot?.token
  const userId = user?.id

  useEffect(() => {
    if (userId && botToken) {
      getUserProfilePhotos(botToken, userId).then(result => {
        if (result.success) {
          setUserAvatar(result.photoUrl)
        }
      })
    }
  }, [userId, botToken])

  const buildDialogMessages = useCallback(() => {
    if (!userId || !botId) return []
    const events = getEvents(botId, {})
    return events
      .filter(event =>
        event.userId === userId &&
        (event.type === 'message' ||
          event.type === 'message_sent' ||
          event.type === 'command' ||
          event.data?.text)
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(event => {
        const isAdminMessage = event.type === 'message_sent' || event.data?.from === 'admin'
        const text = event.data?.text || event.action || event.type
        return {
          id: event.id || event.updateId || `${event.userId}_${event.timestamp}`,
          text,
          from: isAdminMessage ? 'admin' : 'user',
          timestamp: event.timestamp,
          eventId: event.id,
          updateId: event.updateId,
          telegramMessageId: event.data?.messageId || event.data?.message_id,
          chatId: event.data?.chatId || event.data?.chat_id || userId,
          type: event.type,
        }
      })
  }, [botId, userId])

  const refreshMessagesFromStorage = useCallback(() => {
    const formatted = buildDialogMessages()
    setMessages(formatted)
  }, [buildDialogMessages])

  useEffect(() => {
    refreshMessagesFromStorage()
  }, [refreshMessagesFromStorage])

  useEffect(() => {
    if (!userId || !botId) return
    let isActive = true

    const syncAndRefresh = async () => {
      if (botToken) {
        try {
          await syncBotData(botId, botToken)
        } catch (error) {
          console.error('Error syncing bot data:', error)
        }
      }
      if (isActive) {
        refreshMessagesFromStorage()
      }
    }

    syncAndRefresh()
    const interval = setInterval(syncAndRefresh, 5000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [botId, botToken, refreshMessagesFromStorage, userId])

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
    previousMessageCount.current = messages.length
  }, [messages])

  const handleRefresh = async () => {
    setRefreshing(true)

    if (botToken) {
      try {
        await syncBotData(botId, botToken)
      } catch (error) {
        console.error('Error syncing bot data:', error)
      }
    }

    refreshMessagesFromStorage()
    setRefreshing(false)
  }

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault()
    }
    if (!newMessage.trim() || !botToken) return
    
    setSending(true)
    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      if (isDemoToken(botToken)) {
        addEvent(botId, {
          userId,
          type: 'message_sent',
          action: 'message',
          data: {
            text: messageText,
            from: 'admin',
            messageId: Date.now(),
            chatId: userId,
          },
          timestamp: new Date().toISOString(),
        })
        refreshMessagesFromStorage()
        setSending(false)
        return
      }

      const result = await sendMessage(botToken, user.id, messageText)
      
      if (result.success) {
        addEvent(botId, {
          userId: user.id,
          type: 'message_sent',
          action: 'message',
          data: {
            text: messageText,
            from: 'admin',
            messageId: result.message?.message_id,
            chatId: result.message?.chat?.id || user.id,
          },
          timestamp: new Date().toISOString(),
        })

        refreshMessagesFromStorage()
      } else {
        alert(`${t('sendError')}: ${result.error}`)
        setNewMessage(messageText) // Возвращаем текст обратно
      }
    } catch (error) {
      alert(`${t('error')}: ${error.message}`)
      setNewMessage(messageText) // Возвращаем текст обратно
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-2xl w-full h-[80vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-dark-300">
          <div className="flex items-center space-x-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={user.first_name || user.username}
                className="w-10 h-10 rounded-full"
                onError={() => setUserAvatar(null)}
              />
            ) : (
              <div className="w-10 h-10 bg-primary-900/50 rounded-full flex items-center justify-center">
                {user.first_name || user.username ? (
                  <span className="text-primary-400 font-semibold">
                    {(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-5 w-5 text-primary-400" />
                )}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-100">
                {user.first_name || user.username || `ID: ${user.id}`}
              </h3>
              <p className="text-sm text-gray-400">
                {user.username ? `@${user.username}` : `ID: ${user.id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 group ${message.from === 'admin' ? 'justify-end' : ''}`}>
              {message.from === 'admin' ? null : (
                userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={user.first_name || user.username}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    onError={() => {}}
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-400" />
                  </div>
                )
              )}
              <div className={`flex-1 relative ${message.from === 'admin' ? 'max-w-[80%]' : ''}`}>
                <div className={`rounded-lg p-3 ${
                  message.from === 'admin' 
                    ? 'bg-primary-600' 
                    : 'bg-dark-300'
                }`}>
                  <p className={`text-sm ${
                    message.from === 'admin' 
                      ? 'text-white' 
                      : 'text-gray-300'
                  }`}>
                    {message.text}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.from === 'admin' 
                      ? 'text-primary-200' 
                      : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleString(t('language') === 'en' ? 'en-US' : 'ru-RU')}
                  </p>
                </div>
                {message.from === 'admin' && (
                  <button
                    onClick={() => setShowDeleteConfirm(message)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600/20 rounded text-red-400"
                    title={t('deleteMessage')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {message.from === 'admin' && (
                <div className="w-8 h-8 bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-400" />
                </div>
              )}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>{t('noMessages')}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">{t('confirmDeleteMessage')}</h2>
              <p className="text-gray-400 mb-6">
                {t('confirmDeleteMessageText')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const eventIdentifier = showDeleteConfirm.eventId || showDeleteConfirm.updateId

                    if (botToken && showDeleteConfirm.telegramMessageId && showDeleteConfirm.from === 'admin') {
                      deleteTelegramMessage(botToken, showDeleteConfirm.chatId || user.id, showDeleteConfirm.telegramMessageId)
                    }

                    if (eventIdentifier) {
                      const deleted = deleteEvent(botId, eventIdentifier)
                      if (deleted) {
                        const updatedMessages = messages.filter(m => m.id !== showDeleteConfirm.id)
                        setMessages(updatedMessages)
                        refreshMessagesFromStorage()
                      }
                    }
                    setShowDeleteConfirm(null)
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors btn-glow btn-glow-red"
                >
                  {t('delete')}
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


        <div className="border-t border-dark-300 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('enterMessage')}
              disabled={!botToken}
              className="flex-1 px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !botToken}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed btn-glow btn-glow-primary"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? t('sending') : t('send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserDialog
