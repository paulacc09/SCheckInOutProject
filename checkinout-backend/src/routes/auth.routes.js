const router = require('express').Router();
const { login, registro, perfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware'); 
const passport = require('../utils/passport');
const jwt = require('jsonwebtoken');

router.post('/login', login);
router.post('/registro', registro);
router.get('/perfil', verificarToken, perfil);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + '/registro?error=google_not_found'
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, rol: req.user.rol, empresa_id: req.user.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.redirect(process.env.FRONTEND_URL + '/auth/google?token=' + token);
  }
);

module.exports = router;