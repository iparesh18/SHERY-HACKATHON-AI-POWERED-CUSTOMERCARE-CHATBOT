const formatRelative = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString();
};

const shortId = (value) => {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export { formatRelative, shortId };
