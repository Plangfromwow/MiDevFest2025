import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function BusinessIdSetup() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateBusinessId = useMutation(api.users.updateBusinessId);
  const [businessId, setBusinessId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId.trim()) {
      toast.error("Please enter a business ID");
      return;
    }

    setSubmitting(true);
    void updateBusinessId({ businessId: businessId.trim() })
      .then(() => {
        toast.success("Business ID saved successfully!");
        setBusinessId("");
      })
      .catch((error) => {
        toast.error("Failed to save business ID");
        console.error(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Welcome to Reputation Copilot
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentUser?.businessId 
              ? "Update your business ID" 
              : "Set up your business ID to get started"}
          </p>
        </div>

        {currentUser?.businessId && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current Business ID:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                {currentUser.businessId}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="businessId"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Business ID
            </label>
            <input
              id="businessId"
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter your business ID"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : currentUser?.businessId ? "Update Business ID" : "Set Business ID"}
          </button>
        </form>

        {currentUser?.businessId && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Once you're done, refresh the page to see your dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
