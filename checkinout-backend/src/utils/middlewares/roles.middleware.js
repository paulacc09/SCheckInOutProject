const { error } = require('../utils/response');

const permitirRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) return error(res, 'No autenticado', 401);
    if (!roles.includes(req.usuario.rol)) {
      return error(res, 'No tienes permiso para esta acción', 403);
    }
    next();
  };
};

module.exports = { permitirRoles };