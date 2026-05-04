const router = require('express').Router();
const { login, registro, perfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');
const passport = require('../utils/passport');
const jwt = require('jsonwebtoken');

router.post('/login', login);
router.post('/registro', registro);
router.get('/perfil', verificarToken, perfil);

const googleNoConfig = (req, res) =>
  res.status(503).json({
    ok: false,
    message:
      'Login con Google no está configurado. Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env',
  });

if (passport.googleOAuthConfigured) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: (process.env.FRONTEND_URL || '') + '/login?error=google',
    }),
    (req, res) => {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          rol: req.user.rol,
          empresa_id: req.user.empresa_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      res.redirect(
        (process.env.FRONTEND_URL || 'http://localhost:5173') +
          '/auth/google?token=' +
          token
      );
    }
  );
} else {
  router.get('/google', googleNoConfig);
  router.get('/google/callback', googleNoConfig);
}

module.exports = router;