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

        const nombre = profile?.name?.givenName || 'Usuario';
        const apellido = profile?.name?.familyName || 'Google';

        const [result] = await pool.execute(
          `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, empresa_id)
           VALUES (?, ?, ?, 'GOOGLE_AUTH', 'administrador', NULL)`,
          [nombre, apellido, email]
        );

        const [nuevoUsuarioRows] = await pool.execute(
          `SELECT * FROM usuarios WHERE id = ? LIMIT 1`,
          [result.insertId]
        );

        return done(null, nuevoUsuarioRows[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
