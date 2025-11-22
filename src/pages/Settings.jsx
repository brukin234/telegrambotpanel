import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { Shield, LogOut, UserPlus, Users, X, Check, Edit, Palette } from 'lucide-react'

const Settings = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout, getCredentials } = useAuth()
  const { theme, changeTheme } = useTheme()
  const { language, changeLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('security')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', days: 30, unlimited: false })
  const [isMainAdminUser, setIsMainAdminUser] = useState(false)

  // Проверяем, является ли текущий пользователь главным админом
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const mainCredentials = getCredentials()
        const currentUser = localStorage.getItem('botpanel_current_user')
        const isMain = currentUser && mainCredentials.username && currentUser === mainCredentials.username
        setIsMainAdminUser(isMain)
      } catch (e) {
        console.error('Error checking admin:', e)
        setIsMainAdminUser(false)
      }
    }
    checkAdmin()
    // Проверяем периодически
    const interval = setInterval(checkAdmin, 2000)
    return () => clearInterval(interval)
  }, [])

  // Загружаем админов из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('botpanel_admins')
    if (saved) {
      try {
        setAdminUsers(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading admins:', e)
      }
    }
  }, [])

  const handleAddAdmin = () => {
    if (!newAdmin.username || !newAdmin.password || (!newAdmin.unlimited && !newAdmin.days)) {
      alert('Заполните все поля')
      return
    }

    const user = {
      id: editingUser?.id || Date.now().toString(),
      username: newAdmin.username,
      password: newAdmin.password,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
      expiresAt: newAdmin.unlimited ? null : (() => {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + parseInt(newAdmin.days))
        return expiresAt.toISOString()
      })(),
      unlimited: newAdmin.unlimited,
      active: true,
    }

    let updated
    if (editingUser) {
      updated = adminUsers.map(u => u.id === editingUser.id ? user : u)
    } else {
      updated = [...adminUsers, user]
    }
    
    setAdminUsers(updated)
    localStorage.setItem('botpanel_admins', JSON.stringify(updated))
    setNewAdmin({ username: '', password: '', days: 30, unlimited: false })
    setEditingUser(null)
    setShowAddAdmin(false)
  }

  const handleEditAdmin = (user) => {
    setEditingUser(user)
    setNewAdmin({
      username: user.username,
      password: user.password,
      days: user.unlimited ? 30 : Math.ceil((new Date(user.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)),
      unlimited: user.unlimited || false,
    })
    setShowAddAdmin(true)
  }

  const handleDeleteAdmin = (id) => {
    const updated = adminUsers.filter(a => a.id !== id)
    setAdminUsers(updated)
    localStorage.setItem('botpanel_admins', JSON.stringify(updated))
  }

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const tabs = [
    { id: 'security', name: t('security'), icon: Shield },
    { id: 'interface', name: t('interface'), icon: Palette },
    ...(isMainAdminUser ? [{ id: 'users', name: t('users'), icon: UserPlus }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderActiveTabContent = () => {
    if (activeTab === 'security') {
      return (
        <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-100">{t('security')}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-100 mb-4">{t('changePassword')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                  />
                </div>
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary">
                  {t('changePasswordButton')}
                </button>
              </div>
            </div>
            <div className="border-t border-dark-300 pt-6">
              <h3 className="font-medium text-gray-100 mb-4">{t('logoutTitle')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('logoutText')}
              </p>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 btn-glow btn-glow-red"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'interface') {
      return (
        <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-100">{t('interface')}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-100 mb-4">{t('language')}</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => changeLanguage('ru')}
                  className={`px-6 py-3 rounded-lg transition-all btn-glow ${
                    language === 'ru'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  {t('russian')}
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-6 py-3 rounded-lg transition-all btn-glow ${
                    language === 'en'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  {t('english')}
                </button>
              </div>
            </div>
            <div className="border-t border-dark-300 pt-6">
              <h3 className="font-medium text-gray-100 mb-4">{t('theme')}</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => changeTheme('green')}
                  className={`px-6 py-3 rounded-lg transition-all btn-glow flex items-center space-x-2 ${
                    theme === 'green'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${theme === 'green' ? 'bg-green-500' : 'bg-primary-500'}`}></div>
                  <span>{t('greenTheme')}</span>
                </button>
                <button
                  onClick={() => changeTheme('blue')}
                  className={`px-6 py-3 rounded-lg transition-all btn-glow flex items-center space-x-2 ${
                    theme === 'blue'
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${theme === 'blue' ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                  <span>{t('blueTheme')}</span>
                </button>
                <button
                  onClick={() => changeTheme('white')}
                  className={`px-6 py-3 rounded-lg transition-all btn-glow flex items-center space-x-2 ${
                    theme === 'white'
                      ? 'bg-gray-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${theme === 'white' ? 'bg-gray-400' : 'bg-gray-400'}`}></div>
                  <span>{t('whiteTheme')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'users') {
      return (
        <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-100">{t('userManagement')}</h2>
            <button
              onClick={() => {
                setEditingUser(null)
                setNewAdmin({ username: '', password: '', days: 30, unlimited: false })
                setShowAddAdmin(true)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 btn-glow btn-glow-primary"
            >
              <UserPlus className="h-5 w-5" />
              <span>{t('addUser')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {adminUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noUsersAdded')}</p>
              </div>
            ) : (
              adminUsers.map(admin => {
                const isExpired = !admin.unlimited && admin.expiresAt && new Date(admin.expiresAt) < new Date()
                const daysLeft = admin.unlimited ? null : (admin.expiresAt ? Math.ceil((new Date(admin.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null)

                return (
                  <div key={admin.id} className="border border-dark-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-100">{admin.username}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {t('created')}: {new Date(admin.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU')}
                        </p>
                        <p className={`text-sm mt-1 ${
                          admin.unlimited ? 'text-primary-400' :
                          isExpired ? 'text-red-400' : 
                          daysLeft !== null && daysLeft <= 7 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {admin.unlimited 
                            ? t('unlimitedAccess') 
                            : isExpired 
                              ? t('accessExpired') 
                              : `${t('accessUntil')}: ${new Date(admin.expiresAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU')} (${t('daysLeft')} ${daysLeft} ${t('days')})`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-2 text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors btn-glow"
                          title={t('edit')}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors btn-glow btn-glow-red"
                          title={t('delete')}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-dark-50 page-transition">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('settings')}</h1>
          <p className="text-gray-400">{t('settingsDescription')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 relative overflow-hidden ${
                        activeTab === tab.id
                          ? 'bg-primary-900/50 text-primary-400'
                          : 'text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                      )}
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                      <span className="font-medium transition-all duration-300">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div
              key={activeTab}
              className="animate-fade-in animate-slide-up transition-all duration-300 ease-out"
            >
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">{t('logoutConfirm')}</h2>
            <p className="text-gray-400 mb-6">
              {t('logoutConfirmText')}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 btn-glow btn-glow-red"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('logout')}</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-3 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors btn-glow"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-100">
                {editingUser ? t('editUser') : t('addUser')}
              </h2>
              <button
                onClick={() => {
                  setShowAddAdmin(false)
                  setNewAdmin({ username: '', password: '', days: 30, unlimited: false })
                  setEditingUser(null)
                }}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('loginField')}
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                  placeholder={t('enterLogin')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('passwordField')}
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                  placeholder={t('enterPasswordField')}
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                          type="checkbox"
                          checked={newAdmin.unlimited}
                          onChange={(e) => setNewAdmin({ ...newAdmin, unlimited: e.target.checked })}
                          className="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">{t('unlimitedAccessCheckbox')}</span>
                </label>
              </div>
              {!newAdmin.unlimited && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('accessPeriod')}
                  </label>
                  <input
                    type="number"
                    value={newAdmin.days}
                    onChange={(e) => setNewAdmin({ ...newAdmin, days: parseInt(e.target.value) || 30 })}
                    min="1"
                    className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-500"
                    placeholder="30"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAdmin(false)
                  setNewAdmin({ username: '', password: '', days: 30, unlimited: false })
                  setEditingUser(null)
                }}
                className="flex-1 px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddAdmin}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 btn-glow btn-glow-primary"
              >
                <Check className="h-5 w-5" />
                <span>{editingUser ? t('save') : t('add')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings


