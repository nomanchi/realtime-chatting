import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink'

interface ThemeState {
  isDarkMode: boolean
  themeColor: ThemeColor
  toggleTheme: () => void
  setTheme: (isDark: boolean) => void
  setThemeColor: (color: ThemeColor) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      themeColor: 'blue',

      toggleTheme: () => set((state) => {
        const newDarkMode = !state.isDarkMode
        // Update document class
        if (typeof document !== 'undefined') {
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
        return { isDarkMode: newDarkMode }
      }),

      setTheme: (isDark) => set({
        isDarkMode: isDark
      }),

      setThemeColor: (color) => set({
        themeColor: color
      })
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (typeof document !== 'undefined' && state) {
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }
    }
  )
)
