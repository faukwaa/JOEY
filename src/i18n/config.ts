import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

const getSavedLanguage = async (): Promise<string> => {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language')
    if (saved) return saved

    // Try to get from Electron settings
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.getUserSettings()
        if (result.settings?.language) {
          return result.settings.language
        }
      } catch {
        // Ignore error
      }
    }
  }
  // Fallback to browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh'
  return 'en'
}

const initLanguage = async () => {
  const savedLang = await getSavedLanguage()
  i18n.changeLanguage(savedLang)
  localStorage.setItem('language', savedLang)
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

// Initialize language from storage
initLanguage()

export default i18n
