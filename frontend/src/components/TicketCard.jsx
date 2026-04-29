import Badge from "./Badge.jsx";
import { formatRelative, shortId } from "../utils/format.js";

const TicketCard = ({ ticket, children }) => {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Ticket</p>
          <h3 className="mt-2 text-lg font-semibold">{ticket.issue}</h3>
          <p className="mt-2 text-xs text-muted">ID: {shortId(ticket._id)}</p>
        </div>
        <Badge label={ticket.status} tone={ticket.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>Created {formatRelative(ticket.createdAt)}</span>
        <span>
          Assigned: {ticket.assignedTo ? shortId(ticket.assignedTo) : "Unassigned"}
        </span>
      </div>
      {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
};

export default TicketCard;
