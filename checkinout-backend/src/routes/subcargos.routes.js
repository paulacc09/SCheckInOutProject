const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { success, error } = require('../utils/response');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM subcargos WHERE estado = 1 ORDER BY nombre ASC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
