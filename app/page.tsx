'use client';

import { useState, useEffect, useRef } from 'react';
import SOCDashboard from '../components/SOCDashboard';
import WebsiteSecurityPanel from '../components/WebsiteSecurityPanel';
import ThreatPopup from '../components/ThreatPopup';
import SecurityWarningPopup, { SecurityWarningData } from '../components/SecurityWarningPopup';
import AttackSimulator from '../components/AttackSimulator';
import { playAlert, playScan, playBlock, preloadSounds } from '../lib/sounds';

/* ── Types ── */
interface TrafficData { _id: string; id?: string; ip: string; port: number; protocol: string; requestCount: number; timestamp: string; riskScore?: number; threatStatus?: string; attackType?: string; alertFlag?: boolean; aiReason?: string; }
interface DetectionStats { _id: string; count: number; avgRiskScore: number; }
interface Alert { _id: string; threatStatus: string; attackType: string; riskScore: number; trafficData: { ip: string; port: number; protocol: string; requestCount: number }; reasons?: string[]; }
interface BlockedIP { ip: string; blockedAt: string; reason: string; attackType: string; riskScore: number; }
interface ResponseLog { _id: string; ip: string; attackType: string; riskScore: number; decision: { action: string; reason: string; severity: string }; timestamp: string; }
interface WebsiteScan { _id: string; domain: string; securityScore: number; riskScore: number; threats: string[]; timestamp: string; }
interface WebsiteAlert { _id: string; domain: string; riskScore: number; threats: string[]; severity: string; timestamp: string; }

type Tab = 'dashboard' | 'logs' | 'alerts' | 'response' | 'websecurity' | 'civic';

const NAV: { id: Tab; label: string; prefix: string }[] = [
  { id: 'dashboard',   label: 'DASHBOARD',       prefix: '>' },
  { id: 'logs',        label: 'TRAFFIC LOGS',     prefix: '>' },
  { id: 'alerts',      label: 'THREAT ANALYSIS',  prefix: '>' },
  { id: 'response',    label: 'RESPONSE ENGINE',  prefix: '>' },
  { id: 'websecurity', label: 'WEBSITE SECURITY', prefix: '>' },
  { id: 'civic',       label: 'CIVIC AUDIT',      prefix: '>' },
];

function fmtTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('en-US', { hour12: false }); } catch { return '--:--:--'; }
}

function riskTag(score: number) {
  if (score >= 80) return <span className="t-tag red">CRITICAL</span>;
  if (score >= 60) return <span className="t-tag red">HIGH</span>;
  if (score >= 35) return <span className="t-tag yellow">MEDIUM</span>;
  return <span className="t-tag green">LOW</span>;
}

function statusTag(s: string) {
  if (s === 'Attack')     return <span className="t-tag red">ATTACK</span>;
  if (s === 'Suspicious') return <span className="t-tag yellow">SUSPICIOUS</span>;
  return <span className="t-tag green">NORMAL</span>;
}

function riskColor(s: number) {
  if (s >= 70) return 'var(--red)';
  if (s >= 35) return 'var(--yellow)';
  return 'var(--green)';
}

function barClass(pct: number) {
  if (pct >= 75) return 'danger';
  if (pct >= 50) return 'warn';
  return 'ok';
}

export default function Home() {
  const [traffic,       setTraffic]       = useState<TrafficData[]>([]);
  const [stats,         setStats]         = useState<DetectionStats[]>([]);
  const [alerts,        setAlerts]        = useState<Alert[]>([]);
  const [blockedIPs,    setBlockedIPs]    = useState<BlockedIP[]>([]);
  const [responseLogs,  setResponseLogs]  = useState<ResponseLog[]>([]);
  const [websiteScans,  setWebsiteScans]  = useState<WebsiteScan[]>([]);
  const [websiteAlerts, setWebsiteAlerts] = useState<WebsiteAlert[]>([]);
  const [activeTab,     setActiveTab]     = useState<Tab>('dashboard');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [detecting,     setDetecting]     = useState(false);
  const [autoResponse,  setAutoResponse]  = useState(true);
  const [lastScan,      setLastScan]      = useState('');
  const [currentTime,   setCurrentTime]   = useState('');
  const [ragKnowledge,  setRagKnowledge]  = useState<any>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [currentThreat, setCurrentThreat] = useState<any>(null);
  const [showThreat,    setShowThreat]    = useState(false);
  const [aiLog,         setAiLog]         = useState<string[]>([]);
  // Civic state
  const [civicLogs,      setCivicLogs]      = useState<any[]>([]);
  const [civicStats,     setCivicStats]     = useState<any>({});
  const [civicRevoked,   setCivicRevoked]   = useState(false);
  const [civicCmd,       setCivicCmd]       = useState('');
  const [civicStream,    setCivicStream]    = useState<string[]>([]);
  const [civicConnected, setCivicConnected] = useState<boolean | null>(null);
  const [recentSites,    setRecentSites]    = useState<any[]>([]);
  const [securityWarning, setSecurityWarning] = useState<SecurityWarningData | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const prevAlertCount   = useRef(0);
  const prevBlockedCount = useRef(0);

  /* Sound effects — fire on new alerts / blocked IPs */
  useEffect(() => {
    if (alerts.length > prevAlertCount.current) playAlert();
    prevAlertCount.current = alerts.length;
  }, [alerts.length]);

  useEffect(() => {
    if (blockedIPs.length > prevBlockedCount.current) playBlock();
    prevBlockedCount.current = blockedIPs.length;
  }, [blockedIPs.length]);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  /* Preload MP3s on first user interaction to satisfy browser autoplay policy */
  useEffect(() => {
    const unlock = () => { preloadSounds(); window.removeEventListener('click', unlock); };
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  /* Listen for sandbox warning messages from extension content script */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'AINMS_SECURITY_WARNING' && e.data.data) {
        const d = e.data.data;
        setSecurityWarning({
          url:             d.url,
          domain:          d.domain,
          riskScore:       d.riskScore,
          securityScore:   d.securityScore,
          threats:         d.threats ?? [],
          sandboxVerdict:  d.sandboxVerdict ?? 'warning',
          recommendations: d.recommendations ?? [],
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* fetchers */
  const fetchTraffic = async () => { try { const r = await fetch('/api/traffic'); const d = await r.json(); if (d.success) setTraffic(d.data ?? []); } catch {} };
  const fetchDetect  = async () => { try { const r = await fetch('/api/detect');  const d = await r.json(); if (d.success) { setStats(d.stats ?? []); setAlerts(d.alerts ?? []); } } catch {} };
  const fetchRespond = async () => { try { const r = await fetch('/api/respond'); const d = await r.json(); if (d.success) { setBlockedIPs(d.blockedIPs ?? []); setResponseLogs(d.logs ?? []); } } catch {} };
  const fetchWebSec  = async () => { try { const r = await fetch('/api/website-security'); const d = await r.json(); if (d.success) { setWebsiteScans(d.scans ?? []); setWebsiteAlerts(d.alerts ?? []); } } catch {} };
  const fetchCivic   = async () => {
    try {
      const r = await fetch('/api/civic-audit');
      const d = await r.json();
      if (d.success) { setCivicLogs(d.logs ?? []); setCivicStats(d.stats ?? {}); setCivicRevoked(d.revoked ?? false); }
    } catch {}
  };
  const pingCivic = async () => {
    try {
      const r = await fetch('/api/civic-audit?action=ping');
      const d = await r.json();
      setCivicConnected(d.connected ?? false);
    } catch { setCivicConnected(false); }
  };

  // Auto-trigger Civic demo when civic tab is opened
  useEffect(() => {
    if (activeTab === 'civic') {
      fetchCivic();
      setTimeout(() => {
        if (civicLogs.length === 0) triggerCivicDemo();
      }, 500);
    }
  }, [activeTab]); // eslint-disable-line

  // When civic tab is opened, fire real tool calls to populate the log
  const triggerCivicDemo = async () => {
    pushCivic('CIVIC> triggering live tool calls...');
    try {
      const calls = [
        { tool: 'log_security_event', params: { event: 'dashboard_opened', source: 'AI-NMS', timestamp: new Date().toISOString() } },
        { tool: 'retrieve_recent_threats', params: { limit: 5, source: 'AI-NMS' } },
        { tool: 'scan_website', params: { domain: 'lokey-secure.vercel.app', source: 'AI-NMS' } },
        { tool: 'log_security_event', params: { event: 'threat_scan_complete', source: 'AI-NMS', timestamp: new Date().toISOString() } },
      ];
      for (const call of calls) {
        pushCivic(`CIVIC> calling: ${call.tool}...`);
        const r = await fetch('/api/civic-audit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(call),
        });
        const d = await r.json();
        pushCivic(`CIVIC> ${call.tool}: ${d.civicConnected ? 'HUB EXECUTED' : 'LOCAL EXECUTED'}`);
        if (d.auditId) pushCivic(`CIVIC> audit_id: ${d.auditId?.substring(0, 16)}...`);
        if (d.stats) setCivicStats(d.stats);
      }
      await fetchCivic();
      pushCivic('CIVIC> audit log updated');
    } catch { pushCivic('CIVIC> error triggering demo calls'); }
  };

  const refreshAll = () => { fetchTraffic(); fetchDetect(); fetchRespond(); fetchWebSec(); fetchCivic(); };

  useEffect(() => {
    // Initial load
    refreshAll();
    pingCivic();

    // SSE for live updates (replaces 5s polling for traffic/alerts/blockedIPs/recentSites)
    let es: EventSource | null = null;
    const connectSSE = () => {
      es = new EventSource('/api/live-updates');
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.traffic)      setTraffic(d.traffic.map((t: any) => ({ ...t, _id: t.id ?? t._id })));
          if (d.alerts)       setAlerts(d.alerts.map((a: any) => ({
            _id: a.id ?? a._id,
            threatStatus: a.type === 'network' ? (a.severity === 'critical' ? 'Attack' : 'Suspicious') : 'Suspicious',
            attackType: a.attackType ?? 'Unknown',
            riskScore: a.riskScore,
            trafficData: { ip: a.ip ?? a.domain, port: 0, protocol: 'TCP', requestCount: 0 },
            reasons: a.threats,
          })));
          if (d.blockedIPs)   setBlockedIPs(d.blockedIPs);
          if (d.recentSites)  setRecentSites(d.recentSites);
          if (d.responseLogs) setResponseLogs(d.responseLogs.map((r: any) => ({ ...r, _id: r.id ?? r._id })));
        } catch {}
      };
      es.onerror = () => { es?.close(); setTimeout(connectSSE, 3000); };
    };
    connectSSE();

    // Keep simulation running
    const simulate = setInterval(() => { fetch('/api/simulate', { method: 'POST' }).catch(() => {}); }, 4000);
    return () => {
      es?.close();
      clearInterval(simulate);
    };
  }, []); // eslint-disable-line

  /* AI log stream */
  const pushAiLog = (line: string) => {
    setAiLog(prev => [...prev.slice(-49), line]);
    setTimeout(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  };

  /* Civic stream */
  const pushCivic = (line: string) => {
    setCivicStream(prev => [...prev.slice(-99), line]);
  };

  /* actions */
  const toggleCivicRevoke = async () => {
    const action = civicRevoked ? 'restore' : 'revoke';
    pushCivic(`CIVIC> ${action} request sent by operator`);
    try {
      const r = await fetch('/api/civic-audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const d = await r.json();
      setCivicRevoked(d.revoked ?? !civicRevoked);
      pushCivic(`CIVIC> tool access ${d.revoked ? 'REVOKED' : 'RESTORED'}`);
    } catch { pushCivic('CIVIC> error — could not toggle access'); }
  };

  const runCivicCommand = async (cmd: string) => {
    const c = cmd.trim().toLowerCase();
    pushCivic(`CIVIC> $ ${cmd}`);
    if (!c) return;

    if (c.includes('blocked') || c.includes('show blocked')) {
      const ips = blockedIPs.map(b => b.ip).join(', ') || 'none';
      pushCivic(`CIVIC> blocked IPs: ${ips}`);
      return;
    }
    if (c.includes('scan') && c.split(' ').length > 1) {
      const domain = c.split(' ').slice(1).join(' ').replace(/https?:\/\//, '').split('/')[0];
      pushCivic(`CIVIC> tool call: scan_website { domain: "${domain}" }`);
      try {
        const r = await fetch('/api/civic-audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: 'scan_website', params: { domain } }) });
        const d = await r.json();
        pushCivic(`CIVIC> guardrail check: ${d.guardrailPassed ? 'PASSED' : 'BLOCKED'}`);
        pushCivic(`CIVIC> ${d.reason}`);
        pushCivic(`CIVIC> audit_id: ${d.auditId}`);
        if (d.stats) setCivicStats(d.stats);
        await fetchCivic();
      } catch { pushCivic('CIVIC> error executing scan_website'); }
      return;
    }
    if (c.includes('threat') || c.includes('last threat') || c.includes('analyze')) {
      const latest = alerts[0];
      if (!latest) { pushCivic('CIVIC> no recent threats found'); return; }
      pushCivic(`CIVIC> latest threat: ${latest.attackType} from ${latest.trafficData?.ip}`);
      pushCivic(`CIVIC> risk_score: ${latest.riskScore} | status: ${latest.threatStatus}`);
      pushCivic(`CIVIC> reason: ${latest.reasons?.[0] ?? 'unknown'}`);
      return;
    }
    if (c.includes('stats') || c.includes('tools')) {
      Object.entries(civicStats).forEach(([k, v]) => pushCivic(`CIVIC> ${k}: ${v} calls`));
      return;
    }
    if (c.includes('help')) {
      ['show blocked ips', 'scan <domain>', 'analyze last threat', 'stats', 'help'].forEach(h => pushCivic(`CIVIC>   ${h}`));
      return;
    }
    pushCivic(`CIVIC> unknown command — type "help" for options`);
  };

  const runScan = async () => {    setDetecting(true);
    playScan();
    pushAiLog('AI> initiating full network scan...');
    try {
      const r = await fetch('/api/analyze-all', { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        setLastScan(new Date().toLocaleTimeString('en-US', { hour12: false }));
        pushAiLog(`AI> scan complete — ${d.analyzed} packets analyzed`);
        refreshAll();
      }
    } catch { pushAiLog('AI> scan failed — check connection'); }
    finally { setDetecting(false); }
  };

  const fetchRAG = async (attackType: string) => {
    try {
      const r = await fetch(`/api/rag?attackType=${encodeURIComponent(attackType)}`);
      const d = await r.json();
      if (d.success) { setRagKnowledge(d.knowledge); setShowKnowledge(true); setTimeout(() => setShowKnowledge(false), 12000); }
    } catch {}
  };

  const execResponse = async (ip: string, attackType: string, riskScore: number, threatStatus: string) => {
    pushAiLog(`AI> executing response for ${ip} [${attackType}]`);
    try {
      const r = await fetch('/api/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip, attackType, riskScore, threatStatus, autoExecute: autoResponse }) });
      const d = await r.json();
      if (d.success) {
        pushAiLog(`AI> action=${d.decision.action} severity=${d.decision.severity}`);
        refreshAll();
      }
    } catch {}
  };

  const unblock = async (ip: string) => {
    try { const r = await fetch(`/api/respond?action=unblock&ip=${ip}`); const d = await r.json(); if (d.success) { pushAiLog(`AI> unblocked ${ip}`); fetchRespond(); } } catch {}
  };

  /* derived */
  const totalSafe    = traffic.filter(t => (t.riskScore ?? 0) < 35).length;
  const totalSuspect = traffic.filter(t => (t.riskScore ?? 0) >= 35 && (t.riskScore ?? 0) < 70).length;
  const totalAttack  = traffic.filter(t => (t.riskScore ?? 0) >= 70).length;
  const secScore     = traffic.length > 0 ? Math.round((totalSafe / traffic.length) * 100) : 100;
  const netPct       = Math.min(100, Math.round((alerts.length / Math.max(traffic.length, 1)) * 100 * 3));
  // CPU: driven by attack count + request volume (heavier attacks = more processing)
  const avgRequests  = traffic.length > 0 ? traffic.reduce((s, t) => s + (t.requestCount ?? 1), 0) / traffic.length : 0;
  const cpuPct       = Math.min(100, Math.round(15 + (totalAttack / Math.max(traffic.length, 1)) * 60 + Math.min(avgRequests / 5, 20)));
  // RAM: driven by total logs in memory + alert count
  const ramPct       = Math.min(100, Math.round(20 + (traffic.length / 5) + alerts.length * 1.5));
  // STORAGE: driven by total entries across all data (traffic + alerts + responses)
  const storagePct   = Math.min(100, Math.round(((traffic.length + alerts.length + blockedIPs.length) / 600) * 100));

  return (
    <div className="t-shell">

      {/* Security Warning Popup */}
      {securityWarning && (
        <SecurityWarningPopup
          data={securityWarning}
          onLeave={() => setSecurityWarning(null)}
          onProceed={() => setSecurityWarning(null)}
          onViewReport={() => { setActiveTab('websecurity'); setSecurityWarning(null); }}
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`t-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="t-sidebar-logo">
          <div className="t-sidebar-logo-title">AI-NMS<span className="t-cursor" /></div>
          <div className="t-sidebar-logo-sub">NETWORK MONITORING SYSTEM v9.0</div>
        </div>

        <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
          <div className="t-nav-section">// NAVIGATION</div>
          {NAV.map(item => (
            <div key={item.id} className={`t-nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
              <span className="t-nav-prefix">{item.prefix}</span>
              <span>{item.label}</span>
              {item.id === 'alerts'      && alerts.length > 0       && <span className="t-badge">{alerts.length > 99 ? '99+' : alerts.length}</span>}
              {item.id === 'response'    && blockedIPs.length > 0   && <span className="t-badge" style={{ background: 'var(--yellow)', color: '#000' }}>{blockedIPs.length}</span>}
              {item.id === 'websecurity' && websiteAlerts.length > 0 && <span className="t-badge" style={{ background: 'var(--cyan)', color: '#000' }}>{websiteAlerts.length}</span>}
            </div>
          ))}

          <div className="t-nav-section" style={{ marginTop: 8 }}>// TOOLS</div>
          <div className="t-nav-item" onClick={runScan} style={{ opacity: detecting ? 0.5 : 1 }}>
            <span className="t-nav-prefix">$</span>
            <span>{detecting ? 'SCANNING...' : 'RUN AI SCAN'}</span>
          </div>
          <div className="t-nav-item" onClick={refreshAll}>
            <span className="t-nav-prefix">$</span>
            <span>REFRESH DATA</span>
          </div>
          <div className="t-nav-item" onClick={() => setAutoResponse(p => !p)}>
            <span className="t-nav-prefix">$</span>
            <span>AUTO-RESPONSE: <span style={{ color: autoResponse ? 'var(--green)' : 'var(--red)' }}>{autoResponse ? 'ON' : 'OFF'}</span></span>
          </div>
          <div className="t-nav-item">
            <span className="t-nav-prefix">$</span>
            <a href="/sandbox" target="_blank" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>SANDBOX SCANNER ↗</a>
          </div>
          <div className="t-nav-item">
            <span className="t-nav-prefix">$</span>
            <a href="/api/export?format=json" download style={{ color: 'inherit', textDecoration: 'none' }}>EXPORT JSON</a>
          </div>
          <div className="t-nav-item">
            <span className="t-nav-prefix">$</span>
            <a href="/api/export?format=csv" download style={{ color: 'inherit', textDecoration: 'none' }}>EXPORT CSV</a>
          </div>
        </div>

        <div className="t-sidebar-footer">
          <div className="t-sidebar-footer-row">
            <span className="t-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span>SYSTEM ACTIVE</span>
          </div>
          <div style={{ color: 'var(--faint)', fontSize: 10 }}>SESSION STORAGE // NO DB</div>
          {lastScan && <div style={{ color: 'var(--faint)', fontSize: 10, marginTop: 2 }}>LAST SCAN: {lastScan}</div>}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 39 }} />}

      {/* ══ MAIN ══ */}
      <div className="t-main">

        {/* STATUS BAR */}
        <div className="t-statusbar">
          <button className="mobile-only t-btn" style={{ border: 'none', padding: '0 12px 0 0', marginRight: 8 }} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="t-statusbar-item"><span className="ok">●</span> SYS:OK</div>
          <div className="t-statusbar-item"><span className={alerts.length > 0 ? 'warn' : 'ok'}>●</span> NET:{alerts.length > 0 ? 'ALERT' : 'ACTIVE'}</div>
          <div className="t-statusbar-item"><span className="ok">●</span> AI:ONLINE</div>
          <div className="t-statusbar-item"><span className="ok">●</span> EXT:CONNECTED</div>
          <div className="t-statusbar-item" style={{ color: 'var(--faint)' }}>TRAFFIC:{traffic.length}</div>
          <div className="t-statusbar-item" style={{ color: 'var(--faint)' }}>BLOCKED:{blockedIPs.length}</div>
          <div className="t-statusbar-right">
            {alerts.length > 0 && <div className="t-statusbar-item"><span className="err">⚠ {alerts.length} ALERTS</span></div>}
            <div className="t-statusbar-item" style={{ color: civicRevoked ? 'var(--red)' : 'var(--green)' }}>
              CIVIC:{civicRevoked ? 'REVOKED' : civicConnected === true ? 'CONNECTED' : civicConnected === false ? 'LOCAL' : 'CHECKING'}
            </div>
            <div className="t-statusbar-item" style={{ fontFamily: 'var(--font)', color: 'var(--cyan)' }}>{currentTime}</div>
            <div className="t-statusbar-item" style={{ color: 'var(--faint)' }}>MODE:MONITOR</div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="t-content t-fade-in">

          {/* ══ METRICS ROW ══ */}
          <div className="t-metrics-grid">
            {[
              { label: 'TOTAL_REQUESTS', value: traffic.length,      cls: 'ok' },
              { label: 'ACTIVE_ALERTS',  value: alerts.length,       cls: alerts.length > 0 ? 'danger' : 'ok' },
              { label: 'BLOCKED_IPS',    value: blockedIPs.length,   cls: blockedIPs.length > 0 ? 'warn' : 'ok' },
              { label: 'SAFE_TRAFFIC',   value: totalSafe,            cls: 'ok' },
              { label: 'SITES_SCANNED',  value: websiteScans.length, cls: 'ok' },
            ].map((m, i) => (
              <div key={i} className="t-metric">
                <div className="t-metric-label">{m.label}</div>
                <div className={`t-metric-value ${m.cls}`}>{m.value}</div>
                <div className="t-metric-sub">// LIVE</div>
              </div>
            ))}
          </div>

          {/* ══ DASHBOARD TAB ══ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

              {/* Row 1: Resource Monitor + Security Score */}
              <div className="t-grid-2" style={{ marginBottom: 1 }}>

                {/* Resource Monitor */}
                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">RESOURCE_MONITOR</span>
                    <span className="t-panel-meta">LIVE</span>
                  </div>
                  <div className="t-panel-body">
                    {[
                      { label: 'CPU',     pct: cpuPct,     sub: `${totalAttack} attacks processing` },
                      { label: 'RAM',     pct: ramPct,     sub: `${traffic.length} logs in memory` },
                      { label: 'NETWORK', pct: netPct,     sub: `${alerts.length} active alerts` },
                      { label: 'STORAGE', pct: storagePct, sub: `${traffic.length + alerts.length + blockedIPs.length} entries` },
                    ].map(b => (
                      <div key={b.label} className="t-bar-row" style={{ marginBottom: 10 }}>
                        <span className="t-bar-label">{b.label}</span>
                        <div style={{ flex: 1 }}>
                          <div className="t-bar-track">
                            <div className={`t-bar-fill ${barClass(b.pct)}`} style={{ width: `${b.pct}%`, transition: 'width 0.6s ease' }} />
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 2 }}>{b.sub}</div>
                        </div>
                        <span className="t-bar-pct" style={{ color: b.pct >= 75 ? 'var(--red)' : b.pct >= 50 ? 'var(--yellow)' : 'var(--green)' }}>{b.pct}%</span>
                      </div>
                    ))}
                    <hr className="t-divider" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                      {[
                        { l: 'SAFE',    v: totalSafe,    c: 'var(--green)' },
                        { l: 'SUSPECT', v: totalSuspect, c: 'var(--yellow)' },
                        { l: 'ATTACK',  v: totalAttack,  c: 'var(--red)' },
                      ].map(r => (
                        <div key={r.l}>
                          <div className="t-label">{r.l}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: r.c, textShadow: `0 0 8px ${r.c}` }}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Score */}
                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">SECURITY_SCORE</span>
                    <span className="t-panel-meta">COMPUTED</span>
                  </div>
                  <div className="t-panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div style={{ fontSize: 72, fontWeight: 700, color: secScore >= 70 ? 'var(--green)' : secScore >= 40 ? 'var(--yellow)' : 'var(--red)', textShadow: `0 0 30px ${secScore >= 70 ? 'var(--green)' : secScore >= 40 ? 'var(--yellow)' : 'var(--red)'}`, lineHeight: 1, letterSpacing: '-0.04em' }}>
                      {secScore}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6, letterSpacing: '0.12em' }}>SECURITY INDEX / 100</div>
                    <div style={{ marginTop: 16, width: '100%' }}>
                      <div className="t-bar-track" style={{ height: 10 }}>
                        <div className={`t-bar-fill ${barClass(100 - secScore)}`} style={{ width: `${secScore}%` }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                      {secScore >= 80 ? '// SYSTEM SECURE' : secScore >= 50 ? '// THREATS DETECTED' : '// CRITICAL STATE'}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      {stats.map(s => (
                        <div key={s._id} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--faint)', letterSpacing: '0.08em' }}>{s._id?.toUpperCase()}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: s._id === 'Attack' ? 'var(--red)' : s._id === 'Suspicious' ? 'var(--yellow)' : 'var(--green)' }}>{s.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Live Traffic + AI Log */}
              <div className="t-grid-2" style={{ marginBottom: 1 }}>

                {/* Live Traffic Stream */}
                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">LIVE_NETWORK_TRAFFIC</span>
                    <span className="t-panel-meta">{traffic.length} PACKETS</span>
                  </div>
                  <div className="t-panel-body" style={{ padding: '8px 14px' }}>
                    <div className="t-log-stream">
                      {traffic.length === 0
                        ? <div style={{ color: 'var(--faint)', padding: 8 }}>// awaiting traffic data...</div>
                        : traffic.slice(0, 30).map((t, i) => (
                          <div key={t._id ?? i} className="t-log-line">
                            <span className="t-log-time">[{fmtTime(t.timestamp)}]</span>
                            <span className="t-log-ip">IP:{t.ip}</span>
                            <span className="t-log-port">:{t.port}</span>
                            <span className="t-log-port" style={{ color: 'var(--faint)' }}>{t.protocol}</span>
                            <span className={`t-log-status-${t.threatStatus === 'Attack' ? 'danger' : t.threatStatus === 'Suspicious' ? 'warn' : 'safe'}`}>
                              {t.threatStatus === 'Attack' ? '[ATTACK]' : t.threatStatus === 'Suspicious' ? '[SUSPICIOUS]' : '[SAFE]'}
                            </span>
                            {t.riskScore !== undefined && <span style={{ color: riskColor(t.riskScore), marginLeft: 'auto', fontSize: 10 }}>RISK:{t.riskScore}</span>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* AI Analysis Stream */}
                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">AI_ANALYSIS_STREAM</span>
                    <span className="t-panel-meta">GROQ LLM</span>
                  </div>
                  <div className="t-panel-body" style={{ padding: '8px 14px' }}>
                    <div className="t-log-stream" ref={logRef}>
                      {aiLog.length === 0 ? (
                        <>
                          <div className="t-ai-line"><span className="ai-prefix">AI&gt;</span> system initialized</div>
                          <div className="t-ai-line"><span className="ai-prefix">AI&gt;</span> <span className="ai-key">model</span>=<span className="ai-val">llama-3.3-70b-versatile</span></div>
                          <div className="t-ai-line"><span className="ai-prefix">AI&gt;</span> <span className="ai-key">status</span>=<span className="ai-ok">READY</span></div>
                          <div className="t-ai-line"><span className="ai-prefix">AI&gt;</span> awaiting scan command<span className="t-cursor" /></div>
                        </>
                      ) : aiLog.map((line, i) => (
                        <div key={i} className="t-ai-line">
                          <span className="ai-prefix">AI&gt;</span>
                          <span style={{ color: line.includes('BLOCK') || line.includes('failed') ? 'var(--red)' : line.includes('complete') || line.includes('unblocked') ? 'var(--green)' : 'var(--muted)' }}>{line.replace('AI> ', '')}</span>
                        </div>
                      ))}
                      {alerts.slice(0, 3).map((a, i) => (
                        <div key={i} className="t-ai-line">
                          <span className="ai-prefix">AI&gt;</span>
                          <span className="ai-key">detected</span>=<span className="ai-danger">{a.attackType}</span>
                          {' '}<span className="ai-key">ip</span>=<span className="ai-val">{a.trafficData?.ip}</span>
                          {' '}<span className="ai-key">risk</span>=<span style={{ color: riskColor(a.riskScore) }}>{a.riskScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Charts */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">THREAT_DISTRIBUTION_CHARTS</span>
                  <span className="t-panel-meta">RECHARTS // LIVE</span>
                </div>
                <div className="t-panel-body">
                  <SOCDashboard traffic={traffic} stats={stats} alerts={alerts} blockedIPs={blockedIPs} />
                </div>
              </div>

              {/* Row 4: Attack Simulator */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">ATTACK_SIMULATOR</span>
                  <span className="t-panel-meta" style={{ color: 'var(--red)' }}>⚡ LIVE PIPELINE</span>
                </div>
                <div className="t-panel-body">
                  <AttackSimulator />
                </div>
              </div>

              {/* Row 5: Extension panel */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">CHROME_EXTENSION_FEED</span>
                  <span className="t-panel-meta">{websiteScans.length} SCANS</span>
                </div>
                <div className="t-panel-body">
                  {websiteScans.length === 0
                    ? <div style={{ color: 'var(--faint)', fontSize: 11 }}>// no website scans yet — install extension and browse</div>
                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
                        {websiteScans.slice(0, 6).map((s, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRight: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.domain}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 18, fontWeight: 700, color: riskColor(s.riskScore) }}>{s.securityScore}</span>
                              {riskTag(s.riskScore)}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 4 }}>{fmtTime(s.timestamp)}</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ TRAFFIC LOGS TAB ══ */}
          {activeTab === 'logs' && (
            <div className="t-panel">
              <div className="t-panel-header">
                <span className="t-panel-title">TRAFFIC_LOG_STREAM</span>
                <span className="t-panel-meta">{traffic.length} RECORDS // LAST HOUR</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="t-table">
                  <thead>
                    <tr>
                      <th>TIMESTAMP</th>
                      <th>IP_ADDRESS</th>
                      <th>PORT</th>
                      <th>PROTO</th>
                      <th>REQUESTS</th>
                      <th>RISK</th>
                      <th>STATUS</th>
                      <th>ATTACK_TYPE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traffic.length === 0
                      ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--faint)' }}>// no traffic data — run AI scan</td></tr>
                      : traffic.slice(0, 100).map((log, i) => (
                        <tr key={log._id ?? i}>
                          <td className="t-td-time">[{fmtTime(log.timestamp)}]</td>
                          <td className="t-td-ip">{log.ip}</td>
                          <td>{log.port}</td>
                          <td><span className="t-tag muted">{log.protocol}</span></td>
                          <td>{log.requestCount}</td>
                          <td className="t-td-score" style={{ color: riskColor(log.riskScore ?? 0) }}>{log.riskScore ?? '—'}</td>
                          <td>{log.threatStatus ? statusTag(log.threatStatus) : '—'}</td>
                          <td>
                            {log.attackType && log.attackType !== 'None'
                              ? <button className="t-alert-btn cyan" onClick={() => fetchRAG(log.attackType!)}>{log.attackType}</button>
                              : <span style={{ color: 'var(--faint)' }}>—</span>}
                          </td>
                          <td>
                            {log.attackType && log.attackType !== 'None' && (log.riskScore ?? 0) >= 35
                              ? <button className="t-alert-btn" onClick={() => execResponse(log.ip, log.attackType!, log.riskScore!, log.threatStatus ?? 'Suspicious')}>BLOCK</button>
                              : <span style={{ color: 'var(--faint)' }}>—</span>}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ ALERTS TAB ══ */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">THREAT_ANALYSIS</span>
                  <span className="t-panel-meta">{alerts.length} ACTIVE THREATS</span>
                </div>
                <div className="t-panel-body" style={{ padding: '8px 14px' }}>
                  {alerts.length === 0
                    ? <div style={{ color: 'var(--green)', fontSize: 11, padding: 8 }}>// no active threats — system secure</div>
                    : alerts.slice(0, 50).map((a, i) => (
                      <div key={a._id ?? i} className="t-alert-line">
                        <span className={`t-alert-tag ${a.riskScore >= 70 ? 'danger' : a.riskScore >= 35 ? 'warn' : 'info'}`}>
                          {a.riskScore >= 70 ? 'DANGER' : a.riskScore >= 35 ? 'WARNING' : 'INFO'}
                        </span>
                        <span className="t-alert-ip">{a.trafficData?.ip ?? 'UNKNOWN'}</span>
                        <span className="t-alert-type">{a.attackType}</span>
                        <span className="t-alert-score" style={{ color: riskColor(a.riskScore) }}>{Math.round(a.riskScore * 10) / 10}</span>
                        <span className="t-alert-reason">{a.reasons?.[0] ?? a.threatStatus}</span>
                        <button className="t-alert-btn cyan" onClick={() => fetchRAG(a.attackType)}>INFO</button>
                        <button className="t-alert-btn" onClick={() => a.trafficData?.ip ? execResponse(a.trafficData.ip, a.attackType, a.riskScore, a.threatStatus) : undefined}>
                          {a.riskScore >= 60 ? 'BLOCK' : 'LIMIT'}
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Attack type breakdown */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">ATTACK_VECTOR_BREAKDOWN</span>
                  <span className="t-panel-meta">COMPUTED</span>
                </div>
                <div className="t-panel-body">
                  {(() => {
                    const counts: Record<string, number> = {};
                    alerts.forEach(a => { counts[a.attackType] = (counts[a.attackType] || 0) + 1; });
                    return Object.entries(counts).map(([type, count]) => (
                      <div key={type} className="t-bar-row">
                        <span className="t-bar-label" style={{ width: 120 }}>{type}</span>
                        <div className="t-bar-track">
                          <div className="t-bar-fill danger" style={{ width: `${Math.min(100, (count / alerts.length) * 100)}%` }} />
                        </div>
                        <span className="t-bar-pct">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ══ RESPONSE TAB ══ */}
          {activeTab === 'response' && (
            <div className="t-grid-2" style={{ gap: 1 }}>
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">BLOCKED_IPS</span>
                  <span className="t-panel-meta">{blockedIPs.length} ENTRIES</span>
                </div>
                <div className="t-panel-body" style={{ padding: '8px 14px' }}>
                  {blockedIPs.length === 0
                    ? <div style={{ color: 'var(--faint)', fontSize: 11 }}>// no IPs currently blocked</div>
                    : blockedIPs.map((b, i) => (
                      <div key={i} className="t-alert-line">
                        <span className="t-alert-tag danger">BLOCKED</span>
                        <span className="t-alert-ip">{b.ip}</span>
                        <span className="t-alert-reason">{b.reason.substring(0, 50)}</span>
                        <button className="t-alert-btn" style={{ borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => unblock(b.ip)}>UNBLOCK</button>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">RESPONSE_LOG</span>
                  <span className="t-panel-meta">{responseLogs.length} ENTRIES</span>
                </div>
                <div className="t-panel-body" style={{ padding: '8px 14px', maxHeight: 400, overflowY: 'auto' }}>
                  {responseLogs.length === 0
                    ? <div style={{ color: 'var(--faint)', fontSize: 11 }}>// no responses executed yet</div>
                    : responseLogs.map((log, i) => (
                      <div key={i} className="t-alert-line">
                        <span className={`t-alert-tag ${log.decision.severity === 'Critical' ? 'danger' : log.decision.severity === 'High' ? 'warn' : 'info'}`}>
                          {log.decision.action.replace('_', ' ')}
                        </span>
                        <span className="t-alert-ip">{log.ip}</span>
                        <span className="t-alert-reason">{log.decision.reason.substring(0, 55)}</span>
                        <span className="t-log-time">[{fmtTime(log.timestamp)}]</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ WEB SECURITY TAB ══ */}
          {activeTab === 'websecurity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Recent Sites Scanned */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">RECENT_SITES_SCANNED</span>
                  <span className="t-panel-meta">{recentSites.length} SITES</span>
                </div>
                <div className="t-panel-body">
                  {recentSites.length === 0 ? (
                    <div style={{ color: 'var(--faint)', fontSize: 11, padding: 12 }}>// no sandbox scans yet — extension will populate this</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
                      {recentSites.slice(0, 15).map((s: any, i: number) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRight: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.domain}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: riskColor(s.riskScore) }}>{s.securityScore}</span>
                            {riskTag(s.riskScore)}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 4 }}>{fmtTime(s.timestamp)}</div>
                          <div style={{ fontSize: 8, color: s.sandboxVerdict === 'block' ? 'var(--red)' : s.sandboxVerdict === 'warning' ? 'var(--yellow)' : 'var(--green)', marginTop: 2, letterSpacing: '0.08em' }}>
                            {s.sandboxVerdict.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Website Security Analysis */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">WEBSITE_SECURITY_ANALYSIS</span>
                  <span className="t-panel-meta">CHROME EXTENSION FEED</span>
                </div>
                <div className="t-panel-body">
                  <WebsiteSecurityPanel onThreatClick={(threat: WebsiteAlert) => { setCurrentThreat(threat); setShowThreat(true); }} />
                </div>
              </div>
            </div>
          )}

          {/* ══ CIVIC AUDIT TAB ══ */}
          {activeTab === 'civic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

              {/* Civic Status Bar */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">CIVIC_GOVERNANCE_STATUS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="t-panel-meta" style={{ color: civicConnected === true ? 'var(--green)' : civicConnected === false ? 'var(--yellow)' : 'var(--faint)' }}>
                      {civicConnected === true ? '● HUB CONNECTED' : civicConnected === false ? '● LOCAL MODE' : '● CHECKING...'}
                    </span>
                    <button className="t-btn" style={{ padding: '2px 8px', fontSize: 9 }} onClick={pingCivic}>PING</button>
                    <button className="t-btn primary" style={{ padding: '2px 8px', fontSize: 9 }} onClick={triggerCivicDemo}>RUN DEMO CALLS</button>
                  </div>
                </div>
                <div className="t-panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
                  {/* Tool stats */}
                  {[
                    { label: 'BLOCK_IP',       val: civicStats.block_ip       ?? 0, color: 'var(--red)' },
                    { label: 'RATE_LIMIT_IP',  val: civicStats.rate_limit_ip  ?? 0, color: 'var(--yellow)' },
                    { label: 'SCAN_WEBSITE',   val: civicStats.scan_website   ?? 0, color: 'var(--cyan)' },
                    { label: 'LOG_EVENT',      val: civicStats.log_event      ?? 0, color: 'var(--green)' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 9, color: 'var(--faint)', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color, textShadow: `0 0 8px ${s.color}` }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 2 }}>// CALLS</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardrail Status + Revoke Toggle */}
              <div className="t-grid-2" style={{ gap: 1 }}>
                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">GUARDRAIL_STATUS</span>
                  </div>
                  <div className="t-panel-body">
                    {[
                      { rule: 'Cannot block localhost / 127.0.0.1',    status: 'ENFORCED' },
                      { rule: 'Max 5 block_ip calls per minute',        status: 'ENFORCED' },
                      { rule: 'AI cannot revoke own permissions',       status: 'ENFORCED' },
                      { rule: 'All tool calls logged to audit trail',   status: 'ENFORCED' },
                    ].map((g, i) => (
                      <div key={i} className="t-alert-line">
                        <span className="t-alert-tag ok">PASS</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g.rule}</span>
                        <span className="t-tag green" style={{ marginLeft: 'auto', flexShrink: 0 }}>{g.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="t-panel">
                  <div className="t-panel-header">
                    <span className="t-panel-title">AI_TOOL_ACCESS</span>
                    <span className="t-panel-meta" style={{ color: civicRevoked ? 'var(--red)' : 'var(--green)' }}>
                      {civicRevoked ? 'REVOKED' : 'ENABLED'}
                    </span>
                  </div>
                  <div className="t-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {civicRevoked
                        ? '⚠ Tool access has been revoked. AI agent cannot execute any security tools until restored.'
                        : '✓ AI agent has full tool access. All actions are governed by Civic guardrails and logged.'}
                    </div>
                    <button
                      onClick={toggleCivicRevoke}
                      className={`t-btn ${civicRevoked ? 'success' : 'danger'}`}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {civicRevoked ? '[ RESTORE ACCESS ]' : '[ REVOKE ACCESS ]'}
                    </button>
                    {civicRevoked && (
                      <div style={{ fontSize: 10, color: 'var(--red)', border: '1px solid var(--red)', padding: '6px 10px' }}>
                        CIVIC&gt; Tool access revoked via Civic
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Security Assistant */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">AI_SECURITY_ASSISTANT</span>
                  <span className="t-panel-meta">CIVIC-GOVERNED</span>
                </div>
                <div className="t-panel-body" style={{ padding: '8px 14px' }}>
                  <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
                    {civicStream.length === 0 ? (
                      <>
                        <div className="t-ai-line"><span className="ai-prefix">CIVIC&gt;</span> assistant ready</div>
                        <div className="t-ai-line"><span className="ai-prefix">CIVIC&gt;</span> <span className="ai-key">type</span> <span className="ai-val">"help"</span> for available commands</div>
                      </>
                    ) : civicStream.map((line, i) => (
                      <div key={i} className="t-ai-line">
                        <span style={{ color: line.includes('BLOCKED') || line.includes('error') ? 'var(--red)' : line.includes('PASSED') || line.includes('RESTORED') ? 'var(--green)' : line.includes('REVOKED') ? 'var(--yellow)' : 'var(--muted)' }}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={civicCmd}
                      onChange={e => setCivicCmd(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && civicCmd.trim()) { runCivicCommand(civicCmd); setCivicCmd(''); } }}
                      placeholder='show blocked ips | scan <domain> | analyze last threat'
                      style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--cyan)', fontFamily: 'var(--font)', fontSize: 11, padding: '6px 10px', outline: 'none' }}
                    />
                    <button className="t-btn primary" onClick={() => { if (civicCmd.trim()) { runCivicCommand(civicCmd); setCivicCmd(''); } }}>
                      RUN
                    </button>
                  </div>
                </div>
              </div>

              {/* Civic Audit Log */}
              <div className="t-panel">
                <div className="t-panel-header">
                  <span className="t-panel-title">CIVIC_AUDIT_LOG</span>
                  <span className="t-panel-meta">{civicLogs.length} ENTRIES</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="t-table">
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>TOOL</th>
                        <th>PARAMS</th>
                        <th>RESULT</th>
                        <th>CIVIC_ID</th>
                        <th>REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {civicLogs.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--faint)' }}>
                          // no civic tool calls yet — execute a response action to see logs
                        </td></tr>
                      ) : civicLogs.slice(0, 50).map((log, i) => (
                        <tr key={i}>
                          <td className="t-td-time">[{fmtTime(log.timestamp)}]</td>
                          <td className="t-td-ip" style={{ color: 'var(--cyan)' }}>{log.tool}</td>
                          <td style={{ color: 'var(--muted)', fontSize: 10 }}>
                            {Object.entries(log.params ?? {}).slice(0, 2).map(([k, v]) => `${k}:${String(v).substring(0, 20)}`).join(' ')}
                          </td>
                          <td>
                            <span className={`t-tag ${log.result === 'allowed' ? 'green' : log.result === 'blocked' ? 'red' : 'yellow'}`}>
                              {log.result?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ color: 'var(--faint)', fontSize: 9 }}>{log.civicCallId ? log.civicCallId.substring(0, 8) + '…' : '—'}</td>
                          <td style={{ color: 'var(--muted)', fontSize: 10 }}>{log.reason?.substring(0, 55)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>{/* end t-content */}
      </div>{/* end t-main */}

      {/* ══ RAG KNOWLEDGE OVERLAY ══ */}
      {showKnowledge && ragKnowledge && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50, width: 380 }}>
          <div className="t-panel" style={{ boxShadow: 'var(--cyan-glow2)' }}>
            <div className="t-panel-header">
              <span className="t-panel-title">AI_KNOWLEDGE_BASE</span>
              <button className="t-btn" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => setShowKnowledge(false)}>CLOSE</button>
            </div>
            <div className="t-panel-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
                {typeof ragKnowledge === 'string' ? ragKnowledge : (ragKnowledge.description ?? JSON.stringify(ragKnowledge))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ THREAT POPUP ══ */}
      {showThreat && currentThreat && (
        <ThreatPopup
          key={currentThreat._id ?? Date.now()}
          domain={currentThreat.domain}
          riskScore={currentThreat.riskScore}
          threats={currentThreat.threats}
          onClose={() => { setShowThreat(false); setCurrentThreat(null); }}
          onViewDetails={() => { setActiveTab('websecurity'); setShowThreat(false); setCurrentThreat(null); }}
          autoCloseDelay={15000}
        />
      )}

    </div>
  );
}
