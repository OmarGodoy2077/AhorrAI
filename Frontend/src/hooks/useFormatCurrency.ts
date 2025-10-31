import { useCurrency } from '@/context/CurrencyContext';

export const useFormatCurrency = () => {
  const { defaultCurrency } = useCurrency();

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const symbol = defaultCurrency?.symbol || '$';

    // Simple formatting, can be enhanced
    // TODO: Use currencyCode to get the correct symbol for the specific currency
    currencyCode; // Parameter kept for future use
    return `${symbol}${amount.toFixed(2)}`;
  };

  return { formatCurrency, defaultCurrency };
};