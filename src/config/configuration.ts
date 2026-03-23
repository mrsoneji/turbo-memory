export default () => ({
  mongoUri: process.env.KENILITY_MONGODB_URI,
  jwtSecret: process.env.KENILITY_JWT_SECRET,
  refreshSecret: process.env.KENILITY_REFRESH_SECRET || process.env.KENILITY_JWT_SECRET,
  bootstrapToken: process.env.KENILITY_BOOTSTRAP_TOKEN,
  port: parseInt(process.env.KENILITY_PORT || '3000', 10),
  bcryptRounds: parseInt(process.env.KENILITY_BCRYPT_ROUNDS || '10', 10),
  jwtExpiresSeconds: parseInt(process.env.KENILITY_JWT_EXPIRES_SECONDS || '3600', 10),
  refreshExpiresSeconds: parseInt(process.env.KENILITY_REFRESH_EXPIRES_SECONDS || '180', 10),
});
