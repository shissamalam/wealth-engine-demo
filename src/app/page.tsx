'use client';

import { useState, useEffect } from 'react';
import { PasswordGate } from '@/components/auth/PasswordGate';
import { WealthProvider } from '@/context/WealthContext';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { RetirementTab } from '@/components/dashboard/RetirementTab';
import { EducationTab } from '@/components/dashboard/EducationTab';
import { AssetsTab } from '@/components/dashboard/AssetsTab';
import { StocksTab } from '@/components/dashboard/StocksTab';
import { PeopleTab } from '@/components/dashboard/PeopleTab';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import DemoBanner from '@/components/DemoBanner';
import { hasValidSession } from '@/lib/crypto';
import {
  LayoutDashboard,
  TrendingUp,
  GraduationCap,
  Building2,
  LineChart,
  Users,
} from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const hasSession = hasValidSession();
    setIsAuthenticated(hasSession);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <WealthProvider>
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900">
        <DemoBanner />
        <Header onLogout={() => setIsAuthenticated(false)} />

        <main className={`transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
          <div className="container mx-auto px-6 py-8">
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid grid-cols-6 w-full max-w-4xl">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="retirement" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Retirement</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Education</span>
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Assets</span>
                </TabsTrigger>
                <TabsTrigger value="stocks" className="flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Stocks</span>
                </TabsTrigger>
                <TabsTrigger value="people" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">People</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <DashboardTab />
              </TabsContent>

              <TabsContent value="retirement">
                <RetirementTab />
              </TabsContent>

              <TabsContent value="education">
                <EducationTab />
              </TabsContent>

              <TabsContent value="assets">
                <AssetsTab />
              </TabsContent>

              <TabsContent value="stocks">
                <StocksTab />
              </TabsContent>

              <TabsContent value="people">
                <PeopleTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <ChatSidebar isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
      </div>
    </WealthProvider>
  );
}
