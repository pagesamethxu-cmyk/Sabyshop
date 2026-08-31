import React, { createContext, useContext, useEffect } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => useContext(ViewModeContext);

export const ViewModeProvider = ({ children }) => {
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    document.body.classList.remove('phone-auto-scaled-desktop');
  }, []);

  return (
    <ViewModeContext.Provider value={{ isDesktopMode: false }}>
      {children}
    </ViewModeContext.Provider>
  );
};

