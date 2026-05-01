import { useState } from "react";
import { useToast } from "../hooks/useToast.js";
import { ticketService } from "../services/ticket.service.js";

export const RatingModal = ({ ticketId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      pushToast("Please select a rating", "error");
      return;
    }

    setLoading(true);
    try {
      await ticketService.submitFeedback(ticketId, { rating, ratingText: feedback });
      pushToast("Thank you for your feedback!", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to submit feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Rate Your Experience</h2>
        <p className="text-gray-600 mb-6">How satisfied are you with the resolution?</p>

        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-4xl transition-transform hover:scale-110 ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional: Share your feedback..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};
