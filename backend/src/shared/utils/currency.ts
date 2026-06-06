import { ValidationError } from '../errors/AppError';

const RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  SGD: 1.34,
  CHF: 0.9,
  CNY: 7.24,
};

export const SUPPORTED_CURRENCIES = Object.keys(RATES_TO_USD);

export function getRate(from: string, to: string): number {
  const fromRate = RATES_TO_USD[from.toUpperCase()];
  const toRate = RATES_TO_USD[to.toUpperCase()];
  if (!fromRate) throw new ValidationError(`Unsupported currency: ${from}`);
  if (!toRate) throw new ValidationError(`Unsupported currency: ${to}`);
  // rates = units of that currency per 1 USD
  // amount_in_to = amount_in_from * (toRate / fromRate)
  return toRate / fromRate;
}

export function convertAmount(amount: number, from: string, to: string): number {
  if (from.toUpperCase() === to.toUpperCase()) return amount;
  const rate = getRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}

export function toUSD(amount: number, from: string): number {
  return convertAmount(amount, from, 'USD');
}
