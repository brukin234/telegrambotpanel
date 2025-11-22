import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, BarChart3, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useLanguage()
  const isDashboard = location.pathname !== '/' && location.pathname !== '/login'

  const navItems = [
    { name: t('home'), path: '/' },
    { name: t('faq'), path: '/#faq' },
    { name: t('features'), path: '/#features' },
    { name: t('pricing'), path: '/#pricing' },
    { name: t('contacts'), path: '/#contacts' },
  ]

  const dashboardNavItems = [
    { name: t('dashboard'), path: '/dashboard' },
    { name: t('users'), path: '/users' },
    { name: t('bots'), path: '/bots' },
    { name: t('settings'), path: '/settings' },
  ]

  return (
    <header className="bg-dark-100 border-b border-dark-300 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-100">BotPanel</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {isDashboard ? (
              <>
                {dashboardNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'text-primary-400'
                        : 'text-gray-300 hover:text-primary-400'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isDashboard ? (
              <>
                <Link
                  to="/settings?tab=security"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors text-gray-300"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('account')}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/dashboard"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary"
                >
                  {t('launchDemo')}
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {isDashboard
              ? dashboardNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block px-4 py-2 text-sm font-medium text-gray-300 hover:bg-dark-200 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))
              : navItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className="block px-4 py-2 text-sm font-medium text-gray-300 hover:bg-dark-200 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header

