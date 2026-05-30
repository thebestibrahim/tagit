export const ENV = {
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production',
  isStaging: process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging',
  isDevelopment: process.env.NODE_ENV === 'development',
  current: process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'development'
} as const

export type Environment = 'production' | 'staging' | 'development'
