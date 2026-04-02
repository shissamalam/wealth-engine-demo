'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useWealthData } from '@/hooks/useWealthData';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, GraduationCap, Brain, DollarSign } from 'lucide-react';

export function DashboardTab() {
  const { data, calculations, isLoading } = useWealthData();

  if (isLoading || !data || !calculations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  const { retirement, education, netWorth } = calculations;

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <Card className="border-forest-600/30 bg-gradient-to-r from-navy-900 to-forest-900/20">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-400">Total Net Worth</CardDescription>
          <CardTitle className="text-4xl text-white flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-forest-500" />
            {formatCurrency(netWorth.netWorth)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Assets:</span>
              <span className="ml-2 text-forest-400">{formatCurrency(netWorth.totalAssets)}</span>
            </div>
            <div>
              <span className="text-slate-400">Liabilities:</span>
              <span className="ml-2 text-red-400">{formatCurrency(netWorth.totalLiabilities)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gauges Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Retirement Gauge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forest-500" />
              Retirement Readiness
            </CardTitle>
            <CardDescription>4% Rule Progress</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <GaugeChart
              value={retirement.progress}
              label={formatCurrency(retirement.currentBalance)}
              sublabel={`Target: ${formatCurrency(retirement.targetBalance)}`}
              color="#166534"
            />
          </CardContent>
        </Card>

        {/* Education Gauge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              College Funding
            </CardTitle>
            <CardDescription>529 Plan Progress</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <GaugeChart
              value={education.total.progress}
              label={formatCurrency(education.total.current)}
              sublabel={`Target: ${formatCurrency(education.total.target)}`}
              color="#C8843A"
            />
          </CardContent>
        </Card>

        {/* AI Strategy Indicator */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Strategy Feed
            </CardTitle>
            <CardDescription>Latest Insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-4">
              {data.strategyFeed.insights.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400">No insights yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Use the AI chat to generate strategy recommendations.
                  </p>
                </div>
              ) : (
                data.strategyFeed.insights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-400 uppercase">
                        {insight.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          insight.priority === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : insight.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{insight.title}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Annual Withdrawal (4%)</p>
          <p className="text-xl font-semibold text-white mt-1">
            {formatCurrency(retirement.annualWithdrawal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Target Annual Spend</p>
          <p className="text-xl font-semibold text-white mt-1">
            {formatCurrency(data.retirement.targetAnnualSpend)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">529 - Son</p>
          <p className="text-xl font-semibold text-white mt-1">
            {formatCurrency(education.son.current)}
          </p>
          <p className="text-xs text-slate-500">{education.son.yearsRemaining} years to target</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">529 - Daughter</p>
          <p className="text-xl font-semibold text-white mt-1">
            {formatCurrency(education.daughter.current)}
          </p>
          <p className="text-xs text-slate-500">{education.daughter.yearsRemaining} years to target</p>
        </Card>
      </div>
    </div>
  );
}
