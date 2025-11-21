import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ThemeProvider } from "./components/ThemeProvider";
import { BusinessIdSetup } from "./components/BusinessIdSetup";
import { useEffect } from "react";

export default function App() {
  const seedData = useMutation(api.mockData.seedMockData);

  useEffect(() => {
    // Seed mock data on first load
    const hasSeeded = localStorage.getItem("reputation-copilot-seeded");
    if (!hasSeeded) {
      seedData().then(() => {
        localStorage.setItem("reputation-copilot-seeded", "true");
      }).catch(err => console.error("Error seeding mock data:", err));
    }
  }, [seedData]);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-4">
          <h2 className="text-xl font-semibold text-blue-500 dark:text-blue-400">
            Reputation Copilot
          </h2>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </header>
        <main className="flex-1">
          <Content />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

function Content() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Authenticated>
        {currentUser?.businessId ? <Dashboard /> : <BusinessIdSetup />}
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
