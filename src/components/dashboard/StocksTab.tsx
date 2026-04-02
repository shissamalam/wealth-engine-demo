'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWealthData } from '@/hooks/useWealthData';
import { RefreshCw, Sparkles, TrendingUp, TrendingDown, AlertCircle, LineChart } from 'lucide-react';
import type { StockFetchResult, HistoricalPoint } from '@/app/api/stocks/route';
import type { ProjectionResult } from '@/app/api/stocks/project/route';

// ─── Types ─────────────────────────────────────────────────────────────────
interface StockData extends StockFetchResult {
  projection?: ProjectionResult;
}

interface ChartPoint {
  label: string;
  actual?: number;
  projected?: number;
  bull?: number;
  bear?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildChartData(stock: StockData): { points: ChartPoint[]; todayLabel: string } {
  const points: ChartPoint[] = stock.historicalData.map((d) => ({
    label: d.date,
    actual: d.price,
  }));

  const todayLabel = stock.historicalData[stock.historicalData.length - 1]?.date ?? '';

  if (stock.projection) {
    const lastIdx = stock.historicalData.length - 1;
    const lastTs = stock.historicalData[lastIdx]?.timestamp ?? Date.now() / 1000;
    const baseDate = new Date(lastTs * 1000);

    // Overlap the last historical point so the projected line connects smoothly
    points[lastIdx] = {
      ...points[lastIdx],
      projected: stock.projection.projectedPrices[0],
      bull: stock.projection.bullCase[0],
      bear: stock.projection.bearCase[0],
    };

    for (let i = 1; i < 12; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      points.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        projected: stock.projection.projectedPrices[i],
        bull: stock.projection.bullCase[i],
        bear: stock.projection.bearCase[i],
      });
    }
  }

  return { points, todayLabel };
}

// ─── StockCard lives OUTSIDE StocksTab for stable reference ───────────────
interface StockCardProps {
  stock: StockData;
  onProject: () => void;
  isProjecting: boolean;
}

function StockCard({ stock, onProject, isProjecting }: StockCardProps) {
  const { points: chartData, todayLabel } = buildChartData(stock);
  const hasProjection = !!stock.projection;
  const isPositive = stock.change12m >= 0;
  const projReturn = stock.projection?.projectedAnnualReturn ?? 0;

  return (
    <Card className="overflow-hidden">
      {/* Card header */}
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-white">{stock.ticker}</span>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-forest-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{stock.name}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-white">
              {stock.currentPrice > 0 ? `$${stock.currentPrice.toFixed(2)}` : '—'}
            </p>
            <p
              className={`text-sm font-semibold ${
                isPositive ? 'text-forest-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {stock.change12m.toFixed(2)}%{' '}
              <span className="text-xs font-normal text-slate-500">12M</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1 space-y-3">
        {/* Error state */}
        {stock.error ? (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">Market data unavailable for this ticker</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart
                data={chartData}
                margin={{ top: 6, right: 6, bottom: 0, left: -8 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                  domain={['auto', 'auto']}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 2 }}
                  formatter={(val: unknown, key: string) => {
                    const labels: Record<string, string> = {
                      actual: 'Actual',
                      projected: 'Projected',
                      bull: 'Bull Case',
                      bear: 'Bear Case',
                    };
                    return [`$${Number(val).toFixed(2)}`, labels[key] ?? key];
                  }}
                />

                {/* Today reference line */}
                {hasProjection && todayLabel && (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="#334155"
                    strokeDasharray="4 2"
                    label={{
                      value: 'Now',
                      fill: '#475569',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                {/* Bull confidence band — fill only, no visible stroke */}
                {hasProjection && (
                  <Area
                    dataKey="bull"
                    type="monotone"
                    stroke="transparent"
                    fill="#22c55e"
                    fillOpacity={0.08}
                    dot={false}
                    legendType="none"
                    activeDot={false}
                    name="bull"
                  />
                )}

                {/* Bear confidence band — white fill to "erase" below bear */}
                {hasProjection && (
                  <Area
                    dataKey="bear"
                    type="monotone"
                    stroke="transparent"
                    fill="#0f172a"
                    fillOpacity={1}
                    dot={false}
                    legendType="none"
                    activeDot={false}
                    name="bear"
                  />
                )}

                {/* Historical — solid forest green */}
                <Line
                  dataKey="actual"
                  type="monotone"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#22c55e' }}
                  name="actual"
                  connectNulls={false}
                />

                {/* Projected — dashed slate */}
                {hasProjection && (
                  <Line
                    dataKey="projected"
                    type="monotone"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 3, fill: '#94a3b8' }}
                    name="projected"
                    connectNulls={false}
                  />
                )}

                {/* Bull case — thin dashed green */}
                {hasProjection && (
                  <Line
                    dataKey="bull"
                    type="monotone"
                    stroke="#22c55e"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    activeDot={false}
                    name="bull"
                    legendType="none"
                  />
                )}

                {/* Bear case — thin dashed red */}
                {hasProjection && (
                  <Line
                    dataKey="bear"
                    type="monotone"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    activeDot={false}
                    name="bear"
                    legendType="none"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Chart legend */}
            <div className="flex items-center gap-4 text-[10px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-0.5 bg-forest-500 rounded" />
                Actual
              </span>
              {hasProjection && (
                <>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-4 h-0.5 bg-slate-400 rounded"
                      style={{ borderTop: '2px dashed #94a3b8', display: 'inline-block', height: 0 }}
                    />
                    Projected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 bg-forest-500 opacity-50" />
                    Bull
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 bg-red-500 opacity-50" />
                    Bear
                  </span>
                </>
              )}
            </div>

            {/* AI Projection panel */}
            {hasProjection ? (
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-forest-400" />
                    <span className="text-xs font-semibold text-forest-400">
                      AI 12-Month Projection
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      projReturn >= 0 ? 'text-forest-400' : 'text-red-400'
                    }`}
                  >
                    {projReturn >= 0 ? '+' : ''}
                    {projReturn.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {stock.projection!.rationale}
                </p>
                <button
                  className="mt-2 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                  onClick={onProject}
                  disabled={isProjecting}
                >
                  {isProjecting ? 'Refreshing…' : '↺ Regenerate'}
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-forest-400 hover:text-forest-300 border border-slate-700 hover:border-forest-700/60 transition-colors"
                onClick={onProject}
                disabled={isProjecting}
              >
                {isProjecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Generating projection…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Generate AI Projection
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main tab component ────────────────────────────────────────────────────
export function StocksTab() {
  const { data } = useWealthData();
  const [stocks, setStocks] = useState<Record<string, StockData>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [projectingAll, setProjectingAll] = useState(false);
  const [projecting, setProjecting] = useState<Record<string, boolean>>({});
  const [dataError, setDataError] = useState<string | null>(null);

  // ── Collect unique tickers from all account holdings ──────────────────
  const tickerString = (() => {
    if (!data) return '';
    const seen = new Set<string>();
    for (const account of Object.values(data.retirement.accounts)) {
      for (const holding of account.holdings ?? []) {
        if (holding.ticker) seen.add(holding.ticker.toUpperCase());
      }
    }
    return Array.from(seen).sort().join(',');
  })();

  // ── Fetch historical data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!tickerString) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const res = await fetch(`/api/stocks?tickers=${encodeURIComponent(tickerString)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const fetched: Record<string, StockFetchResult> = await res.json();

      // Merge fresh market data while preserving any existing projections
      setStocks((prev) => {
        const merged: Record<string, StockData> = {};
        for (const [ticker, result] of Object.entries(fetched)) {
          merged[ticker] = {
            ...result,
            projection: prev[ticker]?.projection,
          };
        }
        return merged;
      });
    } catch (err) {
      setDataError(String(err));
    } finally {
      setLoadingData(false);
    }
  }, [tickerString]);

  useEffect(() => {
    if (tickerString) fetchData();
  }, [tickerString, fetchData]);

  // ── Project a single ticker ───────────────────────────────────────────
  const projectTicker = useCallback(
    async (ticker: string) => {
      const stock = stocks[ticker];
      if (!stock || !stock.historicalData.length) return;

      setProjecting((prev) => ({ ...prev, [ticker]: true }));
      try {
        const res = await fetch('/api/stocks/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            name: stock.name,
            historicalData: stock.historicalData,
          }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const projection: ProjectionResult = await res.json();

        setStocks((prev) => ({
          ...prev,
          [ticker]: { ...prev[ticker], projection },
        }));
      } catch {
        // Silent fail — button re-enables
      } finally {
        setProjecting((prev) => ({ ...prev, [ticker]: false }));
      }
    },
    [stocks]
  );

  // ── Project all tickers sequentially ─────────────────────────────────
  const projectAll = async () => {
    setProjectingAll(true);
    for (const ticker of Object.keys(stocks)) {
      await projectTicker(ticker);
    }
    setProjectingAll(false);
  };

  if (!data) return null;

  // ── Empty state — no holdings added yet ──────────────────────────────
  if (!tickerString) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <LineChart className="w-14 h-14 text-slate-700" />
        <div>
          <p className="text-slate-300 font-semibold text-lg">No holdings tracked yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Add index funds to your retirement accounts on the{' '}
            <span className="text-forest-400">Retirement</span> tab, then come back here to
            track performance and generate AI projections.
          </p>
        </div>
      </div>
    );
  }

  const stockList = Object.values(stocks);
  const tickers = tickerString.split(',');
  const hasAnyProjection = stockList.some((s) => s.projection);

  return (
    <div className="space-y-6">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Portfolio Stock Tracker</h2>
          <p className="text-sm text-slate-400">
            {tickers.length} fund{tickers.length !== 1 ? 's' : ''} · 12-month history +
            AI forward projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={loadingData}
            className="text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={projectAll}
            disabled={projectingAll || loadingData || !stockList.length}
            className="bg-forest-600 hover:bg-forest-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {projectingAll
              ? 'Projecting…'
              : hasAnyProjection
              ? 'Re-project All'
              : 'Project All'}
          </Button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {dataError && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            Failed to fetch market data: {dataError}
          </p>
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────────── */}
      {loadingData && !stockList.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickers.map((t) => (
            <Card key={t} className="animate-pulse">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-slate-700 rounded w-16" />
                    <div className="h-3 bg-slate-800 rounded w-40" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-5 bg-slate-700 rounded w-20" />
                    <div className="h-3 bg-slate-800 rounded w-12 ml-auto" />
                  </div>
                </div>
                <div className="h-[210px] bg-slate-800 rounded" />
                <div className="h-8 bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Stock cards grid ────────────────────────────────────────── */}
      {!!stockList.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stockList.map((stock) => (
            <StockCard
              key={stock.ticker}
              stock={stock}
              onProject={() => projectTicker(stock.ticker)}
              isProjecting={!!projecting[stock.ticker]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
