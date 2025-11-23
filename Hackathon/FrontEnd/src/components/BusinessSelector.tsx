import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BusinessSelectorProps {
  currentBusinessId?: Id<"businesses"> | null;
  onBusinessChange: (businessId: Id<"businesses">) => void;
}

export function BusinessSelector({ currentBusinessId, onBusinessChange }: BusinessSelectorProps) {
  const userBusinesses = useQuery(api.businesses.getUserBusinesses);

  if (!userBusinesses || userBusinesses.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600 dark:text-slate-400">
        Business:
      </label>
      <select
        value={currentBusinessId || ""}
        onChange={(e) => onBusinessChange(e.target.value as Id<"businesses">)}
        className="px-3 py-1 text-sm rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Business...</option>
        {userBusinesses.map((business) => (
          <option key={business._id} value={business._id}>
            {business.name}
          </option>
        ))}
      </select>
    </div>
  );
}
