const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const pool = require('../config/db');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:3000/api/auth/google/callback';

const googleOAuthConfigured = Boolean(
  clientID &&
    clientSecret &&
    String(clientID).trim() &&
    String(clientSecret).trim()
);

if (googleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          const [rows] = await pool.execute(
            `SELECT * FROM usuarios WHERE email = ? LIMIT 1`,
            [email]
          );

          if (rows.length > 0) {
            return done(null, rows[0]);
          }
          return done(null, false);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

passport.googleOAuthConfigured = googleOAuthConfigured;

module.exports = passport;
