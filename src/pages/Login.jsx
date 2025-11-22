import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { BarChart3, Eye, EyeOff, Copy, Check } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [copied, setCopied] = useState({ username: false, password: false })
  const { login, generateCredentials, getCredentials } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем, есть ли уже сохраненные учетные данные
    const saved = getCredentials()
    if (saved.username && saved.password) {
      setCredentials(saved)
    } else {
      // Генерируем новые учетные данные при первом запуске
      const newCredentials = generateCredentials()
      setCredentials(newCredentials)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError(t('enterLoginPassword'))
      return
    }

    if (login(username, password)) {
      navigate('/dashboard')
    } else {
      setError(t('invalidCredentials'))
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [type]: true })
    setTimeout(() => {
      setCopied({ ...copied, [type]: false })
    }, 2000)
  }

  if (!credentials) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-gray-400">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-dark-200 border border-dark-300 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">BotPanel</h1>
            <p className="text-gray-400">{t('loginTitle')}</p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                placeholder={t('enterUsername')}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500 pr-12"
                  placeholder={t('enterPassword')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold btn-glow btn-glow-primary"
            >
              {t('login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

