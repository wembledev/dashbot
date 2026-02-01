import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface CarModeContextValue {
  carMode: boolean
  setCarMode: (enabled: boolean) => void
  toggleCarMode: () => void
}

const CarModeContext = createContext<CarModeContextValue>({
  carMode: false,
  setCarMode: () => {},
  toggleCarMode: () => {},
})

export function CarModeProvider({ children }: { children: ReactNode }) {
  const [carMode, setCarModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashbot-car-mode') === 'true'
    }
    return false
  })

  // Persist to localStorage and set body class
  useEffect(() => {
    localStorage.setItem('dashbot-car-mode', String(carMode))
    if (carMode) {
      document.documentElement.classList.add('car-mode')
    } else {
      document.documentElement.classList.remove('car-mode')
    }
  }, [carMode])

  const setCarMode = (enabled: boolean) => setCarModeState(enabled)
  const toggleCarMode = () => setCarModeState(prev => !prev)

  return (
    <CarModeContext.Provider value={{ carMode, setCarMode, toggleCarMode }}>
      {children}
    </CarModeContext.Provider>
  )
}

export function useCarMode() {
  return useContext(CarModeContext)
}
