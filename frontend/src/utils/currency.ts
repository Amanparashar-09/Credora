/**
 * Format number as USDT
 * USDT is the stablecoin used in contracts
 */
export const formatUSDT = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0 USDT';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num) + ' USDT';
};

/**
 * Format large numbers with commas (no currency symbol)
 */
export const formatNumber = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Convert Wei to USDT (18 decimals)
 */
export const weiToUSDT = (wei: string | bigint): number => {
  const weiStr = typeof wei === 'bigint' ? wei.toString() : wei;
  return parseFloat(weiStr) / 1e18;
};

/**
 * Convert USDT to Wei (18 decimals)
 */
export const usdtToWei = (usdt: number): bigint => {
  return BigInt(Math.floor(usdt * 1e18));
};
