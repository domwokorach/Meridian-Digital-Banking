export const money = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
export const shortMoney = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);
export const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
export const initials = (name: string) => name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
export const sumMoney = (amounts: number[]) => amounts.reduce((sum, a) => sum + Math.round(a * 100), 0) / 100;
export const accountEnding = (num: string) => `Account ending ${num.slice(-4)}`;
export const maskedAccount = (num: string) => `•••• ${num.slice(-4)}`;
export const isoDate = (daysAgo = 0) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };
