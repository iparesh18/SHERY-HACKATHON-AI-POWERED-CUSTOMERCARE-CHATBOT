/**
 * Example usage scenarios for SkeletonMessage component
 * 
 * This file demonstrates various use cases and configurations
 * Delete or modify as needed for your project
 */

import SkeletonMessage from "./SkeletonMessage.jsx";

/**
 * Scenario 1: Basic Implementation (Recommended)
 * Used in the main Chat component - shows single skeleton while AI responds
 */
export const BasicSkeletonExample = () => {
  return (
    <div className="space-y-3">
      {/* User message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-white text-ink px-4 py-3 text-sm">
          Hello, can you help me with my order?
        </div>
      </div>

      {/* Skeleton loader while AI responds */}
      <SkeletonMessage lines={3} />

      {/* (Real message would replace skeleton) */}
    </div>
  );
};

/**
 * Scenario 2: Custom Line Count
 * Useful for different response lengths or message previews
 */
export const CustomLineCountExample = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3">Short Response (2 lines)</p>
        <SkeletonMessage lines={2} />
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Medium Response (3 lines)</p>
        <SkeletonMessage lines={3} />
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Long Response (4 lines)</p>
        <SkeletonMessage lines={4} />
      </div>
    </div>
  );
};

/**
 * Scenario 3: Multiple Sequential Skeletons
 * Could be used for multi-step AI responses or parallel processing
 */
export const MultipleSkeletonsExample = () => {
  return (
    <div className="space-y-3">
      {/* First AI response loading */}
      <div>
        <p className="text-xs text-muted mb-2">Step 1: Analyzing your issue...</p>
        <SkeletonMessage lines={2} />
      </div>

      {/* Second AI response loading */}
      <div>
        <p className="text-xs text-muted mb-2">Step 2: Finding solutions...</p>
        <SkeletonMessage lines={3} />
      </div>
    </div>
  );
};

/**
 * Scenario 4: Responsive Chat Thread
 * Full conversation example with skeleton
 */
export const ResponsiveChatThreadExample = () => {
  return (
    <div className="space-y-3 p-4">
      {/* Initial AI greeting */}
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-2xl bg-ember/20 text-white border border-ember/40 px-4 py-3 text-sm">
          Hi there! How can I help you today?
        </div>
      </div>

      {/* User question */}
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-white text-ink px-4 py-3 text-sm">
          I need help with my billing
        </div>
      </div>

      {/* AI thinking/loading */}
      <SkeletonMessage lines={3} />

      {/* (Real response would appear here) */}
    </div>
  );
};

/**
 * Scenario 5: Themed Backgrounds
 * Integration with different background styles
 */
export const ThemedSkeletonExample = () => {
  return (
    <div className="space-y-8">
      {/* Light glass background */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-muted mb-3">Light Glass Background</p>
        <SkeletonMessage lines={3} />
      </div>

      {/* Dark background */}
      <div className="rounded-2xl bg-slate-900 p-4">
        <p className="text-sm text-gray-400 mb-3">Dark Background</p>
        <SkeletonMessage lines={3} />
      </div>

      {/* White background */}
      <div className="rounded-2xl bg-white p-4">
        <p className="text-sm text-slate-600 mb-3">White Background</p>
        <SkeletonMessage lines={3} />
      </div>
    </div>
  );
};

/**
 * Scenario 6: Loading States Comparison
 * Shows different UI states during message flow
 */
export const LoadingStatesExample = () => {
  return (
    <div className="space-y-6">
      {/* Loading - Initial */}
      <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-3">
          🔄 Initial Send - Skeleton Appears
        </p>
        <SkeletonMessage lines={3} />
      </div>

      {/* Loading - Processing */}
      <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
          ⚙️ Processing - Shimmer Active
        </p>
        <SkeletonMessage lines={3} />
      </div>

      {/* Complete - Message Arrived */}
      <div className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-3">
          ✅ Complete - Message Displayed
        </p>
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-2xl bg-ember/20 text-white border border-ember/40 px-4 py-3 text-sm">
            Your billing information has been updated. Your next invoice is due on...
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Example Component
 * Renders all scenarios together
 */
export const AllSkeletonExamples = () => {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Skeleton Loading Examples</h2>
        <p className="text-sm text-muted">All possible configurations and use cases</p>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-4">1. Basic Implementation</h3>
        <BasicSkeletonExample />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">2. Custom Line Counts</h3>
        <CustomLineCountExample />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">3. Multiple Skeletons</h3>
        <MultipleSkeletonsExample />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">4. Responsive Chat Thread</h3>
        <ResponsiveChatThreadExample />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">5. Themed Backgrounds</h3>
        <ThemedSkeletonExample />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">6. Loading States Comparison</h3>
        <LoadingStatesExample />
      </section>
    </div>
  );
};

export default AllSkeletonExamples;
