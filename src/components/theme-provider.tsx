import { useEffect, useState, useCallback } from 'react'
import { ThemeContext, type Theme } from '@/components/theme-context'

function useThemeProvider() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // 从存储加载主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await window.electronAPI.getUserSettings()
        if (result.settings?.theme) {
          setThemeState(result.settings.theme)
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
      }
    }
    loadTheme()
  }, [])

  // 根据主题设置更新 DOM
  useEffect(() => {
    const root = window.document.documentElement

    const updateTheme = () => {
      let actualTheme: 'light' | 'dark' = 'light'

      if (theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        actualTheme = theme
      }

      setResolvedTheme(actualTheme)

      root.classList.remove('light', 'dark')
      root.classList.add(actualTheme)
    }

    updateTheme()

    // 监听系统主题变化
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => updateTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      await window.electronAPI.saveUserSettings({ theme: newTheme })
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }, [])

  return { theme, setTheme, resolvedTheme }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useThemeProvider()

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
