const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const pool = require('../config/db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
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

        return done(null, false, { message: 'email_not_found' });
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
