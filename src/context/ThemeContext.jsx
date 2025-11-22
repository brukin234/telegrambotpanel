import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('botpanel_theme') || 'green'
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('botpanel_theme') || 'green'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  useEffect(() => {
    localStorage.setItem('botpanel_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

