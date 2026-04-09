import { NextRequest, NextResponse } from 'next/server';

const FEATHERLESS_BASE = 'https://api.featherless.ai/v1';
const MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

export async function POST(req: NextRequest) {
  try {
    const { ip, attackType, riskScore, reasons, port, protocol } = await req.json();

    const apiKey = process.env.FEATHERLESS_API_KEY;

    // ── No key yet — return a clear placeholder so the UI still renders ──
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        noKey: true,
        narrative: null,
        message: 'FEATHERLESS_API_KEY not set in .env.local',
      });
    }

    const prompt = `You are a senior cybersecurity analyst. Analyze this threat and write a concise incident report.

THREAT DETAILS:
- Source IP: ${ip}
- Attack Type: ${attackType}
- Risk Score: ${riskScore}/100
- Port: ${port ?? 'unknown'}
- Protocol: ${protocol ?? 'unknown'}
- Detection Reasons: ${(reasons ?? []).join('; ')}

Write a 3-paragraph incident report covering:
1. What is happening and why it is dangerous
2. Immediate actions the operator should take right now
3. Long-term hardening recommendations

Be specific, technical, and concise. No bullet points — prose only.`;

    const res = await fetch(`${FEATHERLESS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       MODEL,
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  400,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({
        success: false,
        narrative: null,
        message: `Featherless API error ${res.status}: ${err.substring(0, 120)}`,
      });
    }

    const data = await res.json();
    const narrative = data.choices?.[0]?.message?.content?.trim() ?? null;

    return NextResponse.json({ success: true, narrative, model: MODEL });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      narrative: null,
      message: err?.message ?? 'Unknown error',
    });
  }
}
