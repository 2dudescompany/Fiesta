import React, { createContext, useContext, useState } from 'react';

type DictationContextType = {
  isDictationEnabled: boolean;
  enableDictation: () => void;
  disableDictation: () => void;
  toggleDictation: () => void;
};

const DictationContext = createContext<DictationContextType | undefined>(
  undefined
);

export const DictationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDictationEnabled, setIsDictationEnabled] = useState(false);

  const enableDictation = () => setIsDictationEnabled(true);
  const disableDictation = () => setIsDictationEnabled(false);
  const toggleDictation = () =>
    setIsDictationEnabled((prev) => !prev);

  return (
    <DictationContext.Provider
      value={{
        isDictationEnabled,
        enableDictation,
        disableDictation,
        toggleDictation,
      }}
    >
      {children}
    </DictationContext.Provider>
  );
};

export function useDictation() {
  const context = useContext(DictationContext);
  if (!context) {
    throw new Error('useDictation must be used within DictationProvider');
  }
  return context;
}
