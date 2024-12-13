import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SchemaContextType {
  isOpen: boolean;
  openSchema: () => void;
  closeSchema: () => void;
}

export const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSchema = () => setIsOpen(true);
  const closeSchema = () => setIsOpen(false);

  return (
    <SchemaContext.Provider value={{ isOpen, openSchema, closeSchema }}>
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchemaViewer() {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error('useSchemaViewer must be used within a SchemaProvider');
  }
  return context;
}