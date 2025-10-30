import { useCurrency } from '@/context/CurrencyContext';

export const useFormatCurrency = () => {
  const { defaultCurrency } = useCurrency();

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const code = currencyCode || defaultCurrency?.code || 'USD';
    const symbol = defaultCurrency?.symbol || '$';

    // Simple formatting, can be enhanced
    return `${symbol}${amount.toFixed(2)}`;
  };

  return { formatCurrency, defaultCurrency };
};