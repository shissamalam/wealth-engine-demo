import { NextRequest } from 'next/server';

export interface HistoricalPoint {
  date: string;      // "Jan 25"
  timestamp: number; // unix seconds
  price: number;
}

export interface StockFetchResult {
  ticker: string;
  name: string;
  currentPrice: number;
  change12m: number; // percentage
  historicalData: HistoricalPoint[];
  error?: string;
}

// ─── Yahoo Finance v8 chart endpoint ──────────────────────────────────────
async function fetchTicker(ticker: string): Promise<StockFetchResult> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker)}?interval=1mo&range=1y&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Accept: 'application/json',
    },
    // Cache each ticker for 1 hour to limit Yahoo Finance hits
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance returned ${res.status} for ${ticker}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data returned for ${ticker}`);

  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const currentPrice: number = result.meta?.regularMarketPrice ?? 0;
  const longName: string =
    result.meta?.longName ?? result.meta?.shortName ?? ticker;

  const historicalData: HistoricalPoint[] = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      timestamp: ts,
      price: closes[i] ?? 0,
    }))
    .filter((d) => d.price > 0);

  const firstPrice = historicalData[0]?.price ?? 0;
  const lastPrice = historicalData[historicalData.length - 1]?.price ?? 0;
  const change12m =
    firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

  return {
    ticker,
    name: longName,
    currentPrice,
    change12m,
    historicalData,
  };
}

// ─── GET /api/stocks?tickers=VTSAX,VTIAX ─────────────────────────────────
export async function GET(req: NextRequest) {
  const rawTickers = req.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = rawTickers
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return Response.json({ error: 'No tickers provided' }, { status: 400 });
  }

  const settled = await Promise.allSettled(tickers.map(fetchTicker));

  const resultMap: Record<string, StockFetchResult> = {};
  settled.forEach((outcome, i) => {
    const ticker = tickers[i];
    if (outcome.status === 'fulfilled') {
      resultMap[ticker] = outcome.value;
    } else {
      resultMap[ticker] = {
        ticker,
        name: ticker,
        currentPrice: 0,
        change12m: 0,
        historicalData: [],
        error: String(outcome.reason),
      };
    }
  });

  return Response.json(resultMap);
}
