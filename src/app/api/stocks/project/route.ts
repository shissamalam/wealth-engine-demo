import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { HistoricalPoint } from '../route';

export interface ProjectionResult {
  projectedPrices: number[];       // 12 base-case monthly closes
  bullCase: number[];              // 12 optimistic monthly closes
  bearCase: number[];              // 12 pessimistic monthly closes
  rationale: string;               // 2-3 sentence analyst commentary
  projectedAnnualReturn: number;   // e.g. 7.5 for 7.5%
}

// ─── POST /api/stocks/project ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  let ticker: string;
  let name: string;
  let historicalData: HistoricalPoint[];

  try {
    ({ ticker, name, historicalData } = await req.json());
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!historicalData?.length) {
    return Response.json(
      { error: 'No historical data provided.' },
      { status: 400 }
    );
  }

  const lastPrice = historicalData[historicalData.length - 1].price;
  const priceHistory = historicalData
    .map((d) => `${d.date}: $${d.price.toFixed(2)}`)
    .join('\n');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a quantitative financial analyst. When asked to project prices, return ONLY valid JSON — no markdown, no code fences, no prose outside the JSON object.`,
    messages: [
      {
        role: 'user',
        content: `Analyze the 12-month price history for ${name} (${ticker}) and project the next 12 monthly closing prices.

Historical monthly closing prices (oldest → newest):
${priceHistory}

Most recent close: $${lastPrice.toFixed(2)}

Rules:
- projectedPrices, bullCase, and bearCase must each contain exactly 12 numbers
- bullCase values must all be ≥ projectedPrices values
- bearCase values must all be ≤ projectedPrices values
- projectedAnnualReturn is the percentage gain/loss from the most recent close to projectedPrices[11]
- rationale should be 2-3 sentences covering trend, macro factors, and key risks

Return ONLY this JSON (no surrounding text):
{
  "projectedPrices": [<12 numbers>],
  "bullCase": [<12 numbers>],
  "bearCase": [<12 numbers>],
  "rationale": "<string>",
  "projectedAnnualReturn": <number>
}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/```(?:json)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed: ProjectionResult = JSON.parse(cleaned);

    // Basic validation
    if (
      !Array.isArray(parsed.projectedPrices) ||
      parsed.projectedPrices.length !== 12
    ) {
      throw new Error('projectedPrices must have 12 entries');
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: `Failed to parse projection: ${String(err)}`, raw },
      { status: 500 }
    );
  }
}
