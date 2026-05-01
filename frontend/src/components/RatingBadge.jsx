export const RatingBadge = ({ rating }) => {
  if (!rating) return null;

  const getColor = () => {
    if (rating >= 4) return "text-green-400";
    if (rating >= 3) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className={`flex items-center gap-1 text-sm font-semibold ${getColor()}`}>
      <span>★</span>
      <span>{rating.toFixed(1)}</span>
    </div>
  );
};
