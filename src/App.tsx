import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageLoader, DashboardSkeleton, DropSkeleton } from "@/components/PageLoader";

// Eagerly load the index page for fast initial render
import Index from "./pages/Index";

// Lazy load all other pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Membership = lazy(() => import("./pages/Membership"));
const Drop = lazy(() => import("./pages/Drop"));
const DropPreview = lazy(() => import("./pages/DropPreview"));
const Manifesto = lazy(() => import("./pages/Manifesto"));
const Archive = lazy(() => import("./pages/Archive"));
const ArchiveDropDetail = lazy(() => import("./pages/ArchiveDropDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/manifesto" element={
                  <Suspense fallback={<PageLoader />}>
                    <Manifesto />
                  </Suspense>
                } />
                <Route path="/membership" element={
                  <Suspense fallback={<PageLoader />}>
                    <Membership />
                  </Suspense>
                } />
                <Route path="/auth" element={
                  <Suspense fallback={<PageLoader />}>
                    <Auth />
                  </Suspense>
                } />
                <Route path="/dashboard" element={
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Dashboard />
                  </Suspense>
                } />
                <Route path="/drop" element={
                  <Suspense fallback={<DropSkeleton />}>
                    <Drop />
                  </Suspense>
                } />
                <Route path="/drop/preview" element={
                  <Suspense fallback={<DropSkeleton />}>
                    <DropPreview />
                  </Suspense>
                } />
                <Route path="/archive" element={
                  <Suspense fallback={<PageLoader />}>
                    <Archive />
                  </Suspense>
                } />
                <Route path="/archive/:dropId" element={
                  <Suspense fallback={<DropSkeleton />}>
                    <ArchiveDropDetail />
                  </Suspense>
                } />
                <Route path="/admin" element={
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Admin />
                  </Suspense>
                } />
                <Route path="/unsubscribe" element={
                  <Suspense fallback={<PageLoader />}>
                    <Unsubscribe />
                  </Suspense>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
