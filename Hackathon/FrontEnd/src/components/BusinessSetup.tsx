import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface BusinessSetupProps {
  onBusinessSelect?: (businessId: Id<"businesses">) => void;
}

export function BusinessSetup({ onBusinessSelect }: BusinessSetupProps = {}) {
  const userBusinesses = useQuery(api.businesses.getUserBusinesses);
  const createBusiness = useMutation(api.businesses.createBusiness);
  const addUserToBusiness = useMutation(api.businesses.addUserToBusiness);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState<Id<"businesses"> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Create business form state
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  
  // Add user form state
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"owner" | "member">("member");

  if (userBusinesses === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className=" rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    setSubmitting(true);
    void createBusiness({
      name: businessName.trim(),
      description: description.trim() || undefined,
      industry: industry.trim() || undefined,
    })
      .then(() => {
        toast.success("Business created successfully!");
        setBusinessName("");
        setDescription("");
        setIndustry("");
        setShowCreateForm(false);
      })
      .catch((error) => {
        toast.error("Failed to create business");
        console.error(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (!showAddUserForm) return;

    setSubmitting(true);
    void addUserToBusiness({
      businessId: showAddUserForm,
      userEmail: userEmail.trim(),
      role: userRole,
    })
      .then(() => {
        toast.success("User added successfully!");
        setUserEmail("");
        setUserRole("member");
        setShowAddUserForm(null);
      })
      .catch((error: any) => {
        toast.error(error.message || "Failed to add user");
        console.error(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                Business Setup
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Create a business or get added to one to access the dashboard
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              {showCreateForm ? "Cancel" : "Create Business"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateBusiness} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Create New Business
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Joe's Coffee Shop"
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe your business"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Industry (optional)
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Restaurant, Retail, Services"
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Business"}
                </button>
              </div>
            </form>
          )}

          {userBusinesses.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <p>You're not part of any business yet.</p>
              <p className="mt-2">Create a business or ask a business owner to add you.</p>
            </div>
          )}
        </div>

        {userBusinesses.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Your Businesses
            </h2>
            <div className="space-y-4">
              {userBusinesses.map((business) => (
                <div
                  key={business._id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {business.name}
                      </h3>
                      {business.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {business.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="capitalize">Role: {business.role}</span>
                        {business.industry && <span>Industry: {business.industry}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {business._id && onBusinessSelect && (
                        <button
                          onClick={() => onBusinessSelect(business._id)}
                          className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                        >
                          View Dashboard
                        </button>
                      )}
                      {business.role === "owner" && business._id && (
                        <button
                          onClick={() => setShowAddUserForm(business._id)}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                        >
                          Add User
                        </button>
                      )}
                    </div>
                  </div>

                  {showAddUserForm === business._id && (
                    <form onSubmit={handleAddUser} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                        Add User to {business.name}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            User Email
                          </label>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Role
                          </label>
                          <select
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value as "owner" | "member")}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-50"
                            disabled={submitting}
                          >
                            <option value="member">Member</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? "Adding..." : "Add User"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddUserForm(null);
                              setUserEmail("");
                              setUserRole("member");
                            }}
                            className="px-3 py-2 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-50 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
