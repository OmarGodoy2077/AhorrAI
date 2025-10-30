import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Currency } from '@/types';
import { currencyService } from '@/services';
import { financialSettingService } from '@/services';

interface CurrencyContextType {
  defaultCurrency: Currency | null;
  currencies: Currency[];
  setDefaultCurrency: (currency: Currency) => void;
  loadCurrencies: () => Promise<void>;
  loadDefaultCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [defaultCurrency, setDefaultCurrencyState] = useState<Currency | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const loadCurrencies = async () => {
    try {
      const data = await currencyService.getAll();
      setCurrencies(data);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const loadDefaultCurrency = async () => {
    if (currencies.length === 0) return;

    try {
      const settings = await financialSettingService.getCurrent();
      if (settings?.default_currency_id) {
        const currency = currencies.find(c => c.id === settings.default_currency_id);
        if (currency) {
          setDefaultCurrencyState(currency);
          return;
        }
      }
    } catch (error) {
      // Settings not found or error, continue to fallback
      console.log('No financial settings found, using fallback currency');
    }

    // Fallback to USD if no settings or error
    const usd = currencies.find(c => c.code === 'USD');
    if (usd) setDefaultCurrencyState(usd);
  };

  const setDefaultCurrency = async (currency: Currency) => {
    setDefaultCurrencyState(currency);
    try {
      let currentSettings;
      try {
        currentSettings = await financialSettingService.getCurrent();
      } catch {
        // No settings exist, will create new one
        currentSettings = null;
      }

      if (currentSettings) {
        await financialSettingService.update(currentSettings.id, {
          default_currency_id: currency.id,
        });
      } else {
        // Create new settings if none exist
        await financialSettingService.create({
          salary: 0, // Default
          default_currency_id: currency.id,
          effective_date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error saving default currency:', error);
      // Don't revert the state change, just log the error
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (currencies.length > 0) {
      loadDefaultCurrency();
    }
  }, [currencies]);

  return (
    <CurrencyContext.Provider
      value={{
        defaultCurrency,
        currencies,
        setDefaultCurrency,
        loadCurrencies,
        loadDefaultCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};