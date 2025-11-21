import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { BusinessSetup } from "./components/BusinessSetup";
import { BusinessSelector } from "./components/BusinessSelector";
import { BusinessInfo } from "./components/BusinessInfo";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { ReviewFeed } from "./components/ReviewFeed";
import { QueuePanel } from "./components/QueuePanel";
import { InsightStrip } from "./components/InsightStrip";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Id } from "../convex/_generated/dataModel";

export default function App() {

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
                    <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-4">
            <h2 className="text-xl font-semibold text-blue-500 dark:text-blue-400">
              Reputation Copilot
            </h2>
            <Authenticated>
              <div className="flex items-center gap-4">
                <BusinessSelectorWrapper />
                <SignOutButton />
                <ThemeToggle />
              </div>
            </Authenticated>
          </header>
          <div className="flex flex-1 overflow-hidden">
            <Authenticated>
              <Sidebar />
            </Authenticated>
            <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 pb-16 md:pb-0">
              <Content />
            </main>
          </div>
          <Authenticated>
            <MobileNav />
          </Authenticated>
          <Toaster />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Business selector for the header (only shown when viewing dashboard)
function BusinessSelectorWrapper() {
  const seedData = useMutation(api.mockData.seedMockData);
  const cleanupMigration = useMutation(api.migrations.cleanupUserBusinessIds);
  const userBusinesses = useQuery(api.businesses.getUserBusinesses);
  const [isReseeding, setIsReseeding] = useState(false);
  
  useEffect(() => {
    // Run migration to clean up old businessId fields (only when authenticated)
    const hasMigrated = localStorage.getItem("reputation-copilot-migrated");
    if (!hasMigrated) {
      cleanupMigration().then(() => {
        localStorage.setItem("reputation-copilot-migrated", "true");
        console.log("Migration completed");
      }).catch(err => console.error("Error running migration:", err));
    }
    
    // Seed mock data on first load (only when authenticated)
    const hasSeeded = localStorage.getItem("reputation-copilot-seeded");
    if (!hasSeeded) {
      seedData().then(() => {
        localStorage.setItem("reputation-copilot-seeded", "true");
      }).catch(err => console.error("Error seeding mock data:", err));
    }
  }, [seedData, cleanupMigration]);
  
  const handleReseed = () => {
    setIsReseeding(true);
    seedData()
      .then(() => {
        localStorage.setItem("reputation-copilot-seeded", "true");
        window.location.reload();
      })
      .catch((err) => {
        console.error("Error reseeding:", err);
        setIsReseeding(false);
      });
  };
  
  // Get current business from localStorage or first business
  const currentBizId = localStorage.getItem("current-business-id");
  
  const handleBusinessChange = (businessId: Id<"businesses">) => {
    localStorage.setItem("current-business-id", businessId);
    window.location.reload(); // Simple approach to refresh with new business
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Dev helper: Reseed data button */}
      {import.meta.env.DEV && (
        <button
          onClick={handleReseed}
          disabled={isReseeding}
          className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors disabled:opacity-50"
          title="Reseed mock data for current week"
        >
          {isReseeding ? "⏳" : "🔄 Reseed"}
        </button>
      )}
      
      {userBusinesses && userBusinesses.length > 1 && (
        <BusinessSelector currentBusinessId={currentBizId as Id<"businesses">} onBusinessChange={handleBusinessChange} />
      )}
    </div>
  );
}

function Content() {
  const userBusinesses = useQuery(api.businesses.getUserBusinesses);
  const [selectedBusinessId, setSelectedBusinessId] = useState<Id<"businesses"> | null>(null);

  // Auto-select business from localStorage or first business
  useEffect(() => {
    if (userBusinesses && userBusinesses.length > 0 && !selectedBusinessId) {
      const savedBizId = localStorage.getItem("current-business-id");
      if (savedBizId && userBusinesses.some(b => b._id === savedBizId)) {
        setSelectedBusinessId(savedBizId as Id<"businesses">);
      } else {
        setSelectedBusinessId(userBusinesses[0]._id);
        localStorage.setItem("current-business-id", userBusinesses[0]._id);
      }
    }
  }, [userBusinesses, selectedBusinessId]);
  
  // Handle business selection
  const handleBusinessSelect = (businessId: Id<"businesses">) => {
    setSelectedBusinessId(businessId);
    localStorage.setItem("current-business-id", businessId);
  };

  if (userBusinesses === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className=" rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Authenticated>
        {userBusinesses.length > 0 ? (
          <>
            {selectedBusinessId ? (
              <div className="p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/reviews" replace />} />
                  <Route path="/reviews" element={
                    <div className="space-y-6">
                      <InsightStrip businessId={selectedBusinessId} />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Review Feed</h2>
                      <ReviewFeed businessId={selectedBusinessId} />
                    </div>
                  } />
                  <Route path="/auto-reply" element={<QueuePanel queueType="auto-reply" businessId={selectedBusinessId} />} />
                  <Route path="/escalations" element={<QueuePanel queueType="escalation" businessId={selectedBusinessId} />} />
                  <Route path="/business-info" element={<BusinessInfo businessId={selectedBusinessId} />} />
                </Routes>
              </div>
            ) : (
              <BusinessSetup onBusinessSelect={handleBusinessSelect} />
            )}
          </>
        ) : (
          <BusinessSetup />
        )}
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <div className="w-full max-w-md mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Reputation Copilot
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Manage customer reviews with AI-powered insights
            </p>
          </div>
          <div className="w-full max-w-md mx-auto">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
