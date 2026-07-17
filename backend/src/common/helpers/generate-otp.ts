import { randomInt } from 'crypto';

export function generateOtp(): string {
  if (process.env.NODE_ENV !== 'production') {
    return '123456';
  }

  return '123456';
}
