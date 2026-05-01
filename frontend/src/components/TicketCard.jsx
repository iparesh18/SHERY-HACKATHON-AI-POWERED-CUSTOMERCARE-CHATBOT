import Badge from "./Badge.jsx";
import { RatingBadge } from "./RatingBadge.jsx";
import { formatRelative, shortId } from "../utils/format.js";

const TicketCard = ({ ticket, children }) => {
  const getSentimentBadge = (sentiment) => {
    const badges = {
      happy: { emoji: "🟢", label: "Happy", color: "text-green-400" },
      neutral: { emoji: "🟡", label: "Neutral", color: "text-yellow-400" },
      frustrated: { emoji: "🔴", label: "Frustrated", color: "text-red-400" }
    };
    return badges[sentiment] || badges.neutral;
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Ticket</p>
          <h3 className="mt-2 text-lg font-semibold">{ticket.issue}</h3>
          <p className="mt-2 text-xs text-muted">ID: {shortId(ticket._id)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge label={ticket.status} tone={ticket.status} />
          {ticket.customerRating && <RatingBadge rating={ticket.customerRating} />}
          {ticket.sentiment && (
            <span className={`text-xs rounded-full px-2 py-1 font-semibold ${getSentimentBadge(ticket.sentiment).color}`}>
              {getSentimentBadge(ticket.sentiment).emoji} {getSentimentBadge(ticket.sentiment).label}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>Created {formatRelative(ticket.createdAt)}</span>
        <span>
          Assigned: {ticket.assignedTo ? shortId(ticket.assignedTo) : "Unassigned"}
        </span>
      </div>
      {children && <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">{children}</div>}
    </div>
  );
};

export default TicketCard;
