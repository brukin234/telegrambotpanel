import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(() => {
    return (
      localStorage.getItem('botpanel_current_user') ||
      localStorage.getItem('botpanel_username') ||
      'main_admin'
    )
  })

  useEffect(() => {
    const savedAuth = localStorage.getItem('botpanel_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
      const storedUser =
        localStorage.getItem('botpanel_current_user') ||
        localStorage.getItem('botpanel_username') ||
        'main_admin'
      setCurrentUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  const login = (username, password) => {
    const savedUsername = localStorage.getItem('botpanel_username')
    const savedPassword = localStorage.getItem('botpanel_password')

    if (username === savedUsername && password === savedPassword) {
      localStorage.setItem('botpanel_auth', 'true')
      localStorage.setItem('botpanel_current_user', username)
      setIsAuthenticated(true)
      setCurrentUser(username)
      return true
    }
    
    const admins = JSON.parse(localStorage.getItem('botpanel_admins') || '[]')
    const admin = admins.find(a => a.username === username && a.password === password)
    if (admin) {
      const expiresAt = admin.unlimited ? null : (admin.expiresAt ? new Date(admin.expiresAt) : null)
      if (admin.unlimited || (expiresAt && expiresAt > new Date())) {
        localStorage.setItem('botpanel_auth', 'true')
        localStorage.setItem('botpanel_current_user', username)
        setIsAuthenticated(true)
        setCurrentUser(username)
        return true
      }
    }
    
    return false
  }

  const logout = () => {
    localStorage.removeItem('botpanel_auth')
    localStorage.removeItem('botpanel_current_user')
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  const generateCredentials = () => {
    const username = `admin_${Math.random().toString(36).substring(2, 10)}`
    const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    localStorage.setItem('botpanel_username', username)
    localStorage.setItem('botpanel_password', password)
    
    return { username, password }
  }

  const getCredentials = () => {
    const username = localStorage.getItem('botpanel_username')
    const password = localStorage.getItem('botpanel_password')
    return { username, password }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        currentUser,
        login,
        logout,
        generateCredentials,
        getCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

