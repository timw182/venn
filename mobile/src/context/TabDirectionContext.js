import { createContext, useContext, useRef } from 'react';

// Shared ref — updated synchronously before navigation so SlideView reads the right direction
const TabDirectionContext = createContext(null);

export function TabDirectionProvider({ children }) {
  const directionRef = useRef('right');
  return (
    <TabDirectionContext.Provider value={directionRef}>
      {children}
    </TabDirectionContext.Provider>
  );
}

export function useTabDirection() {
  return useContext(TabDirectionContext);
}
