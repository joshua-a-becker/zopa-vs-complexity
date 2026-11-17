import React from "react";

// Shared by the negotiation (MaterialsPanel) and the tutorial (DemoUI) so both
// look identical.

// Points a set of options is worth under a role's scoresheet. A feature is
// included when its option index is 0; anything else (or unset) excludes it.
export function pointsOf(roleScoresheet, options) {
  return Object.entries(roleScoresheet || {}).reduce((sum, [category]) => {
    const optionIdx = options?.[category] ?? 1;
    return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
  }, 0);
}

// Calculator (blue box): one checkbox row per feature, with the live total and
// the action buttons (`footer`) in a column beside them.
export function CheckboxCalculator({ roleScoresheet, selectedOptions, onChange, roleRP, footer }) {
  const totalPoints = pointsOf(roleScoresheet, selectedOptions);

  return (
    <div className="bg-blue-50 border border-black rounded-lg p-4">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Table Header */}
          <div className="flex items-center px-3 py-1">
            <span className="w-8 shrink-0"></span> {/* Checkbox space */}
            <span className="text-xs font-bold text-gray-700 uppercase flex-1">
              Feature
            </span>
            <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[72px] text-right">
              Points
            </span>
          </div>

          <div className="space-y-1.5">
            {Object.entries(roleScoresheet).map(([category, options]) => {
              const includeOption = options[0];
              const isChecked = selectedOptions[category] === 0;

              return (
                <label
                  key={category}
                  className={`flex items-start bg-white rounded px-3 py-2 border border-blue-300 cursor-pointer hover:bg-blue-50 ${isChecked ? "bg-blue-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onChange({ ...selectedOptions, [category]: e.target.checked ? 0 : 1 })}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-3 shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800">
                      {category.replace(/_/g, " ")}
                    </span>
                    {includeOption.reason && (
                      <span
                        className="block text-xs text-gray-600 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: includeOption.reason }}
                      />
                    )}
                  </span>
                  <span className={`text-sm font-bold flex-shrink-0 w-[72px] text-right ${
                    isChecked
                      ? (includeOption.score >= 0 ? 'text-blue-600' : 'text-red-600')
                      : 'text-gray-400'
                  }`}>
                    {includeOption.score >= 0 ? '+' : ''}{includeOption.score} pts
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Total + actions */}
        <div className="flex-shrink-0 w-[180px] flex flex-col pt-7">
          <div className="text-center bg-white rounded-lg p-4 shadow-md w-full">
            <h3 className="text-base font-semibold text-gray-700 mb-2">Total Points <span className="block text-xs font-normal text-gray-500">(1 point = £1.00)</span></h3>
            <div className="text-4xl font-bold mb-3 text-blue-600">
              {totalPoints.toFixed(2)}
            </div>
            {roleRP !== undefined && (
              <div className={`text-sm font-semibold ${totalPoints >= roleRP ? 'text-green-600' : 'text-red-600'}`}>
                {totalPoints >= roleRP ? '✓ Beats your alternative!' : '✗ Worse than your alternative.'}
              </div>
            )}
          </div>
          {footer && <div className="mt-4 flex flex-col gap-2 w-full">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

// Included / excluded features of a proposal.
export function ProposalItems({ roleScoresheet, proposal, small = false }) {
  return (
    <div className="space-y-1">
      {Object.entries(roleScoresheet).map(([category]) => {
        const isIncluded = (proposal.options?.[category] ?? 1) === 0;
        return (
          <div key={category} className={`flex items-center ${small ? "text-xs" : "text-sm"}`}>
            <span className={`${small ? "w-3 h-3" : "w-4 h-4"} mr-2 rounded shrink-0 ${isIncluded ? "bg-green-500" : "bg-gray-300"}`}></span>
            <span className="text-gray-700">{category.replace(/_/g, " ")}</span>
          </div>
        );
      })}
    </div>
  );
}

// Color for an "N/M accepted" count: red (0%) → yellow (50%) → green (100%).
export function voteColor(yesVotes, playerCount) {
  const pct = (yesVotes / playerCount) * 100;
  if (pct === 0) return "text-red-400 opacity-95";
  if (pct < 50) return "text-orange-500 opacity-95";
  if (pct === 50) return "text-yellow-600";
  if (pct < 100) return "text-lime-600";
  return "text-green-600";
}
