const ok = (res, message, data) => {
  return res.status(200).json({ success: true, message, data });
};

const created = (res, message, data) => {
  return res.status(201).json({ success: true, message, data });
};

const fail = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ success: false, message, data });
};

export { ok, created, fail };
