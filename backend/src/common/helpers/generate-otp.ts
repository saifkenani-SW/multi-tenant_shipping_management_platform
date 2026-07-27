import { randomInt } from 'crypto';

export function generateOtp(): string {
  if (process.env.NODE_ENV !== 'production') {
    return '123456';
  }

  return randomInt(100000, 1000000).toString();
}
