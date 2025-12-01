// ===========================================
// Branding Context
// ===========================================

import { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../services/api';

const BrandingContext = createContext(null);

const defaultBranding = {
  companyName: 'Virtual Tours',
  companyLogo: null,
  primaryColor: '#7c8cfb',
  secondaryColor: '#9b72f2',
  poweredByText: 'powered by Ozone',
};

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  // Apply CSS variables when branding changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-secondary', branding.secondaryColor);
  }, [branding.primaryColor, branding.secondaryColor]);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const { branding: data } = await settingsApi.getBranding();
      setBranding(data);
    } catch (err) {
      console.error('Failed to load branding:', err);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (data) => {
    try {
      const { branding: updated } = await settingsApi.updateBranding(data);
      setBranding(updated);
      return updated;
    } catch (err) {
      console.error('Failed to update branding:', err);
      throw err;
    }
  };

  const value = {
    branding,
    loading,
    updateBranding,
    refreshBranding: loadBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

export default BrandingContext;
