import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BusinessInfoProps {
  businessId: Id<"businesses">;
}

export function BusinessInfo({ businessId }: BusinessInfoProps) {
  const business = useQuery(api.businesses.getBusiness, { businessId });
  const updateBusiness = useMutation(api.businesses.updateBusiness);
  const members = useQuery(api.businesses.getBusinessMembers, { businessId });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    googlePlaceId: "",
    yelpBusinessId: "",
    facebookPageId: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when business data loads
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || "",
        description: business.description || "",
        industry: business.industry || "",
        address: business.address || "",
        phone: business.phone || "",
        email: business.email || "",
        website: business.website || "",
        googlePlaceId: business.googlePlaceId || "",
        yelpBusinessId: business.yelpBusinessId || "",
        facebookPageId: business.facebookPageId || "",
      });
    }
  }, [business]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateBusiness({
        businessId,
        ...formData,
      });
      toast.success("Business information updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update business information");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original business data
    if (business) {
      setFormData({
        name: business.name || "",
        description: business.description || "",
        industry: business.industry || "",
        address: business.address || "",
        phone: business.phone || "",
        email: business.email || "",
        website: business.website || "",
        googlePlaceId: business.googlePlaceId || "",
        yelpBusinessId: business.yelpBusinessId || "",
        facebookPageId: business.facebookPageId || "",
      });
    }
    setIsEditing(false);
  };

  if (!business) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if current user is an owner
  const isOwner = members?.some((m) => m.role === "owner");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Business Information
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your business details and settings
          </p>
        </div>
        {!isEditing && isOwner && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Edit Information
          </button>
        )}
      </div>

      {/* Business Information Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., Restaurant, Retail, Healthcare"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              placeholder="Brief description of your business"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="contact@business.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="https://www.business.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="123 Main St, City, State ZIP"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Review Platform IDs */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Review Platform Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Google Place ID
              </label>
              <input
                type="text"
                name="googlePlaceId"
                value={formData.googlePlaceId}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="ChIJ..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Yelp Business ID
              </label>
              <input
                type="text"
                name="yelpBusinessId"
                value={formData.yelpBusinessId}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="business-name-city"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Facebook Page ID
              </label>
              <input
                type="text"
                name="facebookPageId"
                value={formData.facebookPageId}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="123456789"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        )}
      </form>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Team Members
        </h2>
        {members && members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.membershipId}
                className="flex justify-between items-center p-3 bg-white border border-slate-100 dark:bg-slate-700 dark:border-slate-600 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {member.name || member.email || "Unknown User"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {member.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    member.role === "owner"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                  }`}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No team members found.</p>
        )}
      </div>
    </div>
  );
}
