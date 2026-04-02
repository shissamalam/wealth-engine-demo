import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { WealthData } from '@/types/wealth';

// ─── Fiduciary System Prompt ─────────────────────────────────────────────────

const FIDUCIARY_PERSONA = `You are a Proactive Family Fiduciary AI — a senior private wealth strategist acting solely in the Henderson family's best financial interests. This is a DEMO with fictional data. Your disposition is professional, calm, concise, and forward-thinking.

ROLE & RESPONSIBILITIES:
- Act as a trusted fiduciary: every recommendation must serve the family's long-term interests.
- Synthesize ALL data provided in the WEALTH SNAPSHOT section before formulating any response.
- Proactively surface risks and opportunities even when not directly asked.

FIDUCIARY PRINCIPLES:
1. RETIREMENT FIRST — Maximize tax-advantaged space (403b, IRA, Roth IRA) before taxable accounts. Track progress toward the 4% Rule target (25× targetAnnualSpend).
2. DEBT STRATEGY — Evaluate mortgage payoff vs. investment trade-offs using the mortgage interest rate as the hurdle rate. If expected market returns exceed the mortgage rate, generally favor investing; if not, favor accelerated payoff.
3. EMERGENCY BUFFER ("DRY POWDER") — Maintain ≥ targetMonths of liquid coverage in the HYSA/Emergency Fund before deploying capital into markets. In elevated-risk macro environments, consider increasing the buffer beyond the stated target.
4. TAX-LOCATION EFFICIENCY — Place high-growth/high-turnover assets in tax-advantaged accounts; hold tax-efficient broad index funds (e.g., VTSAX, VTIAX) in taxable accounts. Avoid holding bonds in taxable accounts when tax-advantaged space is available.
5. EDUCATION FUNDING — Monitor 529 progress toward each beneficiary's target year and target amount. Never jeopardize retirement trajectory to fund education; exhaust scholarship/loan options first.
6. LIFE-STAGE ALIGNMENT — Calibrate risk exposure and savings rates to the family's ages, income, and targetAnnualSpend. As retirement approaches, gradually shift toward capital preservation.

ECONOMIC AWARENESS:
- Reason as if you have awareness of current Leading Economic Indicators (LEI), yield-curve dynamics, Federal Reserve policy trajectory, inflation trends, and relevant geopolitical events.
- When macro signals suggest elevated recession risk (e.g., inverted yield curve, rising unemployment claims, ISM contraction, credit spread widening), proactively recommend building the HYSA dry-powder buffer and reducing discretionary risk.
- When markets present post-correction dislocations, flag systematic deployment strategies (dollar-cost averaging into VTSAX/VTIAX) using idle cash reserves.
- Acknowledge that macro forecasting carries uncertainty — frame economic observations as probabilities, not certainties.

GUARDRAILS — NON-NEGOTIABLE:
- NEVER fabricate, estimate, or extrapolate financial figures not explicitly present in the WEALTH SNAPSHOT. If a figure is unknown, say so and move on.
- DO NOT recommend specific individual stock purchases beyond holdings already shown in the snapshot.
- DO NOT provide legal or tax-filing advice; recommend consulting a CPA/tax advisor for implementation of any tax strategy.
- DO NOT be alarmist. Frame every risk as an opportunity for proactive management.
- If a field shows "Not configured" or $0 in the snapshot, acknowledge it is not yet set up — do NOT ask the user to re-enter data you already have.

RESPONSE FORMAT — STRICT:
- BE BRIEF. Target 60–90 words for simple questions. Never exceed 150 words unless the user explicitly asks for a detailed breakdown.
- VERDICT FIRST. Open with a one-sentence verdict or direct answer (e.g. "Your IRA mix is solid with two fixable inefficiencies."). Never open with analysis or context-setting.
- RECOMMENDATIONS ONLY. State what to do and why in one phrase — skip the reasoning walkthrough. The user does not need to see the thought process.
- USE SHORT BULLETS for multiple action items. Maximum 4 bullets. Each bullet must be one sentence.
- NO MARKDOWN HEADERS. Never use ##, ###, or horizontal rules (---). Plain prose and bullets only.
- NO TABLES. Never render a table. Reference figures inline in prose or bullets.
- END WITH "Bottom Line:" on its own line — one sentence, the single most important takeaway. Always include it.
- If the user asks to "go deeper", "explain more", or "give me the full breakdown", you may expand — but only then.`;

// ─── Wealth Context Formatter ─────────────────────────────────────────────────

function formatWealthContext(data: WealthData): string {
  const lines: string[] = [
    '════════════════════════════════════════════',
    'WEALTH SNAPSHOT — LIVE DATA',
    '════════════════════════════════════════════',
  ];

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // ── Meta ──────────────────────────────────────
  lines.push(`Last Updated: ${data.meta.lastUpdated}  |  Schema v${data.meta.version}`);

  // ── Family ────────────────────────────────────
  if (data.family) {
    const { husband, wife, son, daughter } = data.family;
    const currentYear = new Date().getFullYear();
    lines.push('');
    lines.push('── FAMILY ──────────────────────────────────');
    lines.push(
      `Husband (${husband.name}): Age ${currentYear - husband.birthYear}, ` +
        (husband.employed
          ? `Employed — Gross Salary: ${husband.grossSalary > 0 ? fmt(husband.grossSalary) : 'Not entered'}/yr`
          : 'Not currently employed')
    );
    lines.push(
      `Wife (${wife.name}): Age ${currentYear - wife.birthYear}, ` +
        (wife.employed
          ? `Employed — Gross Salary: ${wife.grossSalary > 0 ? fmt(wife.grossSalary) : 'Not entered'}/yr`
          : 'Not currently employed')
    );
    lines.push(`Son (${son.name}): Age ${currentYear - son.birthYear}`);
    lines.push(`Daughter (${daughter.name}): Age ${currentYear - daughter.birthYear}`);
  }

  // ── Social Security ───────────────────────────
  if (data.socialSecurity) {
    const ss = data.socialSecurity;
    const hasSSData = ss.husbandMonthly > 0 || ss.wifeMonthly > 0;
    lines.push('');
    lines.push('── SOCIAL SECURITY ESTIMATES (at Full Retirement Age) ──');
    if (hasSSData) {
      lines.push(`Husband: ${fmt(ss.husbandMonthly)}/mo  |  Wife: ${fmt(ss.wifeMonthly)}/mo`);
      lines.push(`Combined Annual: ${fmt((ss.husbandMonthly + ss.wifeMonthly) * 12)}`);
    } else {
      lines.push('Not yet configured.');
    }
  }

  // ── Retirement ────────────────────────────────
  const accts = data.retirement.accounts;
  const retirementTotal = Object.values(accts).reduce((sum, a) => sum + (a?.balance ?? 0), 0);
  const fourPctTarget = data.retirement.targetAnnualSpend * 25;
  const retirementProgress = fourPctTarget > 0 ? (retirementTotal / fourPctTarget) * 100 : 0;

  lines.push('');
  lines.push('── RETIREMENT ──────────────────────────────');
  lines.push(`Target Annual Spend in Retirement: ${data.retirement.targetAnnualSpend > 0 ? fmt(data.retirement.targetAnnualSpend) : 'Not set'}`);
  lines.push(`4% Rule Target (25× spend):        ${fourPctTarget > 0 ? fmt(fourPctTarget) : 'Not set'}`);
  lines.push(
    `Total Retirement Balance:          ${fmt(retirementTotal)}  (${retirementProgress.toFixed(1)}% of target)`
  );
  lines.push('');

  const accountEntries: [string, (typeof accts)[keyof typeof accts]][] = [
    ['Vanguard IRA (Mine)', accts.vanguardIRAMine],
    ['Vanguard IRA (Son Beneficiary)', accts.vanguardIRASon],
    ['Vanguard IRA (Daughter Beneficiary)', accts.vanguardIRADaughter],
    ['Employer 403(b)', accts.employer403b],
    ['Wealthfront', accts.wealthfront],
  ];

  for (const [label, acct] of accountEntries) {
    if (!acct) continue;
    const vestingNote =
      acct.vestingPercent != null ? `  [Vested: ${acct.vestingPercent}%]` : '';
    const riskNote = acct.riskScore != null ? `  [Risk Score: ${acct.riskScore}/10]` : '';
    lines.push(
      `  ${label}: ${acct.balance > 0 ? fmt(acct.balance) : '$0 (not yet entered)'}${vestingNote}${riskNote}`
    );
    if (acct.employer) lines.push(`    Employer: ${acct.employer}`);

    if (acct.holdings?.length) {
      // Only surface holdings that have a non-zero value.
      // Zero-value holdings mean the user entered a lump-sum balance without
      // breaking it down by fund — showing $0 lines would confuse the AI.
      const nonZeroHoldings = acct.holdings.filter((h) => h.value > 0);
      if (nonZeroHoldings.length > 0) {
        for (const h of nonZeroHoldings) {
          lines.push(
            `    • ${h.ticker} — ${h.name}: ` +
            `${h.shares > 0 ? h.shares.toLocaleString() + ' shares  ' : ''}` +
            `(Value: ${fmt(h.value)})`
          );
        }
      } else if (acct.balance > 0) {
        // Balance entered as a lump sum; no per-fund breakdown yet
        lines.push(
          `    Holdings: ${acct.holdings.length} fund(s) listed but per-fund values not yet entered — ` +
          `full account balance is ${fmt(acct.balance)}`
        );
      }
    }
  }

  // ── Retirement Scenarios ──────────────────────
  if (data.family?.husband?.birthYear && retirementTotal > 0) {
    const currentYear = new Date().getFullYear();
    const husbandAge = currentYear - data.family.husband.birthYear;
    const growthRate = 0.07;
    const ss = data.socialSecurity;
    const ssAnnual = ss ? (ss.husbandMonthly + ss.wifeMonthly) * 12 : 0;

    lines.push('');
    lines.push('── RETIREMENT SCENARIOS (7% annual growth assumed) ──');

    for (const targetAge of [55, 60, 65]) {
      const yearsUntil = Math.max(targetAge - husbandAge, 0);
      const projected = retirementTotal * Math.pow(1 + growthRate, yearsUntil);
      const inheritances = (data.expectedInheritances ?? [])
        .filter((i) => i.minYears > 0 && i.minYears <= yearsUntil)
        .reduce((s, i) => s + i.estimatedAmount, 0);
      const ssReduces = targetAge >= 62 ? ssAnnual : 0;
      const effectiveNeed = Math.max(data.retirement.targetAnnualSpend - ssReduces, 0);
      const targetNeeded = effectiveNeed * 25;
      const total = projected + inheritances;
      const onTrack = total >= targetNeeded;
      const gap = Math.abs(targetNeeded - total);

      lines.push(
        `  Retire at ${targetAge} (${yearsUntil} yrs away): Projected ${fmt(projected)}` +
        (inheritances > 0 ? ` + ${fmt(inheritances)} inheritance` : '') +
        ` vs. needed ${fmt(targetNeeded)} — ` +
        (onTrack ? `ON TRACK  (surplus: ${fmt(gap)})` : `NEEDS WORK  (gap: ${fmt(gap)})`)
      );
    }
  }

  // ── Education (529) ───────────────────────────
  const { plan529 } = data.education;
  const { son: s529, daughter: d529 } = plan529.beneficiaries;
  const edu529Total = (s529?.balance ?? 0) + (d529?.balance ?? 0);
  const nowYear = new Date().getFullYear();

  lines.push('');
  lines.push('── EDUCATION (529 PLANS) ───────────────────');
  lines.push(`Provider: ${plan529.provider}  |  Combined Balance: ${fmt(edu529Total)}`);
  if (s529) {
    const pct = s529.targetAmount > 0 ? ((s529.balance / s529.targetAmount) * 100).toFixed(1) : '0.0';
    const yrs = Math.max(s529.targetYear - nowYear, 0);
    const gap = Math.max(s529.targetAmount - s529.balance, 0);
    const monthly = yrs > 0 ? fmt(gap / (yrs * 12)) : 'N/A';
    lines.push(
      `  Son (${s529.name}): ${fmt(s529.balance)} / ${fmt(s529.targetAmount)}  [${pct}%]` +
      `  — Target Year: ${s529.targetYear}  (${yrs} yrs)  — Monthly needed to reach target: ${monthly}`
    );
  }
  if (d529) {
    const pct = d529.targetAmount > 0 ? ((d529.balance / d529.targetAmount) * 100).toFixed(1) : '0.0';
    const yrs = Math.max(d529.targetYear - nowYear, 0);
    const gap = Math.max(d529.targetAmount - d529.balance, 0);
    const monthly = yrs > 0 ? fmt(gap / (yrs * 12)) : 'N/A';
    lines.push(
      `  Daughter (${d529.name}): ${fmt(d529.balance)} / ${fmt(d529.targetAmount)}  [${pct}%]` +
      `  — Target Year: ${d529.targetYear}  (${yrs} yrs)  — Monthly needed to reach target: ${monthly}`
    );
  }
  if (data.education.externalGifts?.length) {
    const externalTotal = data.education.externalGifts.reduce((s, g) => s + g.balance, 0);
    lines.push(`  External Education Gifts (combined: ${fmt(externalTotal)}):`);
    for (const g of data.education.externalGifts) {
      lines.push(
        `    • ${g.description} (for: ${g.beneficiary}): ${fmt(g.balance)}` +
        (g.notes ? `  — ${g.notes}` : '')
      );
    }
  }

  // ── Liquid Cash ───────────────────────────────
  const lc = data.assets.liquidCash;
  const totalLiquid =
    (lc.checking?.balance ?? 0) +
    (lc.savings?.balance ?? 0) +
    (lc.emergencyFund?.balance ?? 0);
  const monthlyExpenses =
    data.retirement.targetAnnualSpend > 0 ? data.retirement.targetAnnualSpend / 12 : 0;
  const monthsCovered =
    monthlyExpenses > 0 ? (lc.emergencyFund?.balance ?? 0) / monthlyExpenses : 0;
  const targetMonths = lc.emergencyFund?.targetMonths ?? 6;

  lines.push('');
  lines.push('── LIQUID CASH ─────────────────────────────');
  lines.push(`Total Liquid Cash: ${fmt(totalLiquid)}`);
  if (lc.checking) {
    lines.push(
      `  Checking (${lc.checking.institution ?? 'Not set'} — ${lc.checking.label}): ${fmt(lc.checking.balance)}`
    );
  }
  if (lc.savings) {
    const apyNote = lc.savings.apy != null ? `  APY: ${lc.savings.apy}%` : '';
    lines.push(
      `  Savings/HYSA (${lc.savings.institution ?? 'Not set'} — ${lc.savings.label}): ` +
      `${fmt(lc.savings.balance)}${apyNote}`
    );
  }
  if (lc.emergencyFund) {
    const apyNote = lc.emergencyFund.apy != null ? `  APY: ${lc.emergencyFund.apy}%` : '';
    lines.push(
      `  Emergency Fund (${lc.emergencyFund.institution ?? 'Not set'} — ${lc.emergencyFund.label}): ` +
      `${fmt(lc.emergencyFund.balance)}${apyNote}` +
      `  — ${monthsCovered.toFixed(1)} of ${targetMonths} months covered`
    );
  }

  // ── Real Estate ───────────────────────────────
  const re = data.assets.realEstate;
  if (re?.length) {
    lines.push('');
    lines.push('── REAL ESTATE ─────────────────────────────');
    for (const prop of re) {
      const appreciation =
        prop.purchasePrice > 0 && prop.estimatedValue > 0
          ? (((prop.estimatedValue - prop.purchasePrice) / prop.purchasePrice) * 100).toFixed(1)
          : null;
      lines.push(`  [${prop.id}] ${prop.type} — ${prop.address}`);
      lines.push(
        `    Purchased: ${prop.purchaseDate}` +
        (prop.purchasePrice > 0 ? ` @ ${fmt(prop.purchasePrice)}` : ' (purchase price not entered)') +
        `  →  Est. Value: ` +
        (prop.estimatedValue > 0 ? fmt(prop.estimatedValue) : 'Not entered') +
        (appreciation ? `  (${appreciation}% appreciation)` : '')
      );
      if (prop.notes) lines.push(`    Notes: ${prop.notes}`);
    }
  }

  // ── Liabilities / Mortgage ────────────────────
  const m = data.liabilities.mortgage;
  if (m) {
    const paidOff =
      m.originalAmount > 0 && m.currentBalance > 0
        ? (((m.originalAmount - m.currentBalance) / m.originalAmount) * 100).toFixed(1)
        : null;
    const matchedProp = re?.find((p) => p.address === m.property);
    const equityNet =
      matchedProp && matchedProp.estimatedValue > 0 && m.currentBalance > 0
        ? matchedProp.estimatedValue - m.currentBalance
        : null;

    lines.push('');
    lines.push('── LIABILITIES / MORTGAGE ──────────────────');
    lines.push(`  Property:       ${m.property}`);
    lines.push(`  Lender:         ${m.lender}`);
    lines.push(
      `  Interest Rate:  ${m.interestRate > 0 ? m.interestRate + '%' : 'Not entered'}` +
      `  |  Monthly Payment: ${m.monthlyPayment > 0 ? fmt(m.monthlyPayment) : 'Not entered'}`
    );
    lines.push(
      `  Balance:        ` +
      (m.currentBalance > 0 ? fmt(m.currentBalance) : 'Not entered') +
      (m.originalAmount > 0 ? ` remaining of ${fmt(m.originalAmount)}` : '') +
      (paidOff ? `  (${paidOff}% paid off)` : '')
    );
    lines.push(`  Term:           ${m.termYears}-year  |  Started: ${m.startDate}`);
    if (equityNet !== null) {
      lines.push(`  Home Equity:    ${fmt(equityNet)}  (Est. Value − Mortgage Balance)`);
    }
  }

  // ── Expected Inheritances ─────────────────────
  if (data.expectedInheritances?.length) {
    const totalInheritance = data.expectedInheritances.reduce(
      (sum, i) => sum + (i.estimatedAmount ?? 0),
      0
    );
    lines.push('');
    lines.push('── EXPECTED INHERITANCES ───────────────────');
    lines.push(`Total Estimated: ${fmt(totalInheritance)}`);
    for (const inh of data.expectedInheritances) {
      lines.push(
        `  • ${inh.description} (${inh.beneficiary}): ~${fmt(inh.estimatedAmount)}` +
        (inh.minYears > 0 || inh.maxYears > 0
          ? ` in ${inh.minYears}–${inh.maxYears} years`
          : ' (timeline unknown)')
      );
      if (inh.notes) lines.push(`    Notes: ${inh.notes}`);
    }
  }

  // ── Existing Strategy Insights ────────────────
  if (data.strategyFeed?.insights?.length) {
    lines.push('');
    lines.push('── EXISTING STRATEGY INSIGHTS (reference only — do not duplicate) ──');
    for (const insight of data.strategyFeed.insights) {
      lines.push(
        `  [${insight.priority.toUpperCase()}/${insight.category}] ${insight.title}  (${insight.date})`
      );
      lines.push(`    ${insight.summary}`);
    }
  }

  lines.push('');
  lines.push('════════════════════════════════════════════');
  return lines.join('\n');
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let messages: { role: 'user' | 'assistant'; content: string }[];
  let wealthContext: WealthData | string | undefined;

  try {
    ({ messages, wealthContext } = await req.json());
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: '`messages` must be a non-empty array.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Build the wealth context block.
  // Accepts either the full WealthData object (preferred) or a pre-formatted string (legacy).
  const contextBlock =
    !wealthContext
      ? 'No wealth data was provided for this session.'
      : typeof wealthContext === 'string'
        ? wealthContext
        : formatWealthContext(wealthContext);

  const systemPrompt = `${FIDUCIARY_PERSONA}\n\n${contextBlock}`;

  const client = new Anthropic({ apiKey });

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown streaming error.';
        controller.enqueue(new TextEncoder().encode(`\n\n[Error: ${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
