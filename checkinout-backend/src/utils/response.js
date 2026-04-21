const success = (res, data, status = 200) => {
  return res.status(status).json({ ok: true, data });
};

const error = (res, message, status = 400) => {
  return res.status(status).json({ ok: false, message });
};

module.exports = { success, error };