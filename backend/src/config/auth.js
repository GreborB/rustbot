export const authConfig = {
  secret: process.env.SESSION_SECRET || 'your-secure-session-secret',
  expiresIn: '24h',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}; 