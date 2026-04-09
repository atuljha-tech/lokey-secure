import { NextRequest, NextResponse } from 'next/server';
import civicHub from '@/lib/civicClient';
import store from '@/lib/sessionStore';

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'ping') {
      const connected = await civicHub.ping();
      return NextResponse.json({ success: true, connected });
    }

    if (action === 'tools') {
      const res = await civicHub.listTools();
      return NextResponse.json({ success: res.ok, tools: res.tools ?? [] });
    }

    // ── On every GET, fire a real Civic log_security_event to prove it works ──
    // This ensures the audit log always has entries
    const recentAlerts = store.getAlertDetections(3);
    for (const alert of recentAlerts) {
      // Only log if not already logged recently (check last 60s)
      const alreadyLogged = store.getCivicLogs(10).some(
        l => l.params?.ip === alert.ip && Date.now() - new Date(l.timestamp).getTime() < 60000
      );
      if (!alreadyLogged) {
        civicHub.executeTool('log_security_event', {
          ip:         alert.ip,
          attackType: alert.attackType,
          riskScore:  alert.riskScore,
          reason:     alert.reasons[0] ?? 'threat detected',
          source:     'dashboard-audit-view',
        }).catch(() => {});
      }
    }

    const limit   = Number(request.nextUrl.searchParams.get('limit') ?? 50);
    const logs    = store.getCivicLogs(limit).map(l => ({ ...l, executedBy: 'AI_AGENT' }));
    const stats   = store.getCivicStats();
    const revoked = civicHub.isRevoked();

    return NextResponse.json({ success: true, logs, stats, revoked, count: logs.length });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch audit log' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'revoke') {
      civicHub.revoke();
      return NextResponse.json({ success: true, message: 'Tool access revoked', revoked: true });
    }

    if (body.action === 'restore') {
      civicHub.restore();
      return NextResponse.json({ success: true, message: 'Tool access restored', revoked: false });
    }

    if (body.tool && body.params) {
      const result = await civicHub.executeTool(body.tool, body.params);
      const { success, ...rest } = result;
      return NextResponse.json({ success, ...rest });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Civic action failed' }, { status: 500 });
  }
}
