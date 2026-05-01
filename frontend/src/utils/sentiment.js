/**
 * Simple keyword-based sentiment analysis
 * Returns: 'happy' | 'neutral' | 'frustrated'
 */

const happyKeywords = [
  "thank", "thanks", "thank you", "appreciate", "grateful", "love", "great",
  "excellent", "amazing", "wonderful", "perfect", "happy", "satisfied", "solved",
  "resolved", "working", "fixed", "awesome", "brilliant", "terrific", "fantastic",
  "delighted", "joy", "pleased", "wonderful", "helped", "assistance", "support"
];

const frustratedKeywords = [
  "frustrat", "angry", "upset", "disappointing", "disappointed", "terrible",
  "awful", "horrible", "hate", "dislike", "bad", "worst", "useless", "broken",
  "issue", "problem", "error", "fail", "failed", "not working", "doesn't work",
  "please help", "urgent", "asap", "stuck", "cannot", "can't", "won't", "doesn't",
  "annoying", "annoyed", "ridiculous", "unacceptable", "pathetic", "disgusted"
];

const analyzeSentiment = (text = "") => {
  if (!text || text.trim().length === 0) return "neutral";

  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Count keyword matches
  let happyCount = 0;
  let frustratedCount = 0;

  happyKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) happyCount += matches.length;
  });

  frustratedKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) frustratedCount += matches.length;
  });

  // Normalize by word count
  const happyRatio = happyCount / Math.max(wordCount, 1);
  const frustratedRatio = frustratedCount / Math.max(wordCount, 1);

  // Threshold-based classification
  if (frustratedRatio > happyRatio && frustratedRatio > 0.05) {
    return "frustrated";
  }
  if (happyRatio > frustratedRatio && happyRatio > 0.05) {
    return "happy";
  }
  return "neutral";
};

const getSentimentBadge = (sentiment) => {
  const badges = {
    happy: { emoji: "🟢", label: "Happy", color: "bg-green-500/20 text-green-200" },
    neutral: { emoji: "🟡", label: "Neutral", color: "bg-yellow-500/20 text-yellow-200" },
    frustrated: {
      emoji: "🔴",
      label: "Frustrated",
      color: "bg-red-500/20 text-red-200"
    }
  };
  return badges[sentiment] || badges.neutral;
};

export { analyzeSentiment, getSentimentBadge };
