'use client';

import { useState, useEffect } from 'react';

interface WebsiteScan {
  _id: string;
  domain: string;
  securityScore: number;
  riskScore: number;
  threats: string[];
  timestamp: string;
}

interface WebsiteAlert {
  _id: string;
  domain: string;
  riskScore: number;
  threats: string[];
  severity: string;
  timestamp: string;
}

interface WebsiteSecurityPanelProps {
  onThreatClick?: (threat: WebsiteAlert) => void;
}

// Severity color function
const getThreatSeverity = (threat: string) => {
  const threatLower = threat.toLowerCase();
  if (threatLower.includes('critical') || threatLower.includes('password') || threatLower.includes('secure flag') || threatLower.includes('insecure')) 
    return { level: 'CRITICAL', color: '#ef4444', bgColor: 'bg-red-900/50', borderColor: 'border-red-500', icon: '🔴' };
  if (threatLower.includes('tracking') || threatLower.includes('samesite') || threatLower.includes('xss') || threatLower.includes('csrf')) 
    return { level: 'MEDIUM', color: '#eab308', bgColor: 'bg-yellow-900/50', borderColor: 'border-yellow-500', icon: '🟡' };
  if (threatLower.includes('iframe') || threatLower.includes('long-lived') || threatLower.includes('expires'))
    return { level: 'LOW', color: '#22c55e', bgColor: 'bg-green-900/50', borderColor: 'border-green-500', icon: '🟢' };
  return { level: 'INFO', color: '#3b82f6', bgColor: 'bg-blue-900/50', borderColor: 'border-blue-500', icon: 'ℹ️' };
};

export default function WebsiteSecurityPanel({ onThreatClick }: WebsiteSecurityPanelProps) {
  const [scans, setScans] = useState<WebsiteScan[]>([]);
  const [alerts, setAlerts] = useState<WebsiteAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<WebsiteAlert | null>(null);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/website-security');
      const result = await response.json();
      if (result.success) {
        // Filter out scans with NO real threats
        const realScans = (result.scans || []).filter((scan: WebsiteScan) => {
          // Only show scans that have REAL threats (not just "1 issue" placeholder)
          return scan.threats && scan.threats.length > 0 && scan.threats[0] !== 'No threats detected';
        });
        
        // Filter alerts that have REAL threats
        const realAlerts = (result.alerts || []).filter((alert: WebsiteAlert) => {
          return alert.threats && alert.threats.length > 0 && alert.riskScore > 0;
        });
        
        setScans(realScans);
        setAlerts(realAlerts);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      default: return 'bg-blue-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/40 rounded-2xl p-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <div className="text-2xl font-bold text-blue-400">{scans.length}</div>
              <div className="text-xs text-gray-400">Sites with Issues</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="text-2xl font-bold text-red-400">{alerts.length}</div>
              <div className="text-xs text-gray-400">Active Threats</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-2xl font-bold text-green-400">{scans.filter(s => s.securityScore >= 80).length}</div>
              <div className="text-xs text-gray-400">Secure Sites</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-2xl font-bold text-purple-400">{stats?.totalScans || 0}</div>
              <div className="text-xs text-gray-400">Total Scans</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Security Score Card */}
      {stats && stats.latestRisk > 0 && (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-blue-400 mb-4">📊 Current Security Status</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="#374151" strokeWidth="8" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke={getScoreBgColor(stats.latestScore || 100)}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${((stats.latestScore || 100) / 100) * 364} 364`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(stats.latestScore || 100)}`}>
                  {stats.latestScore || 100}
                </span>
                <span className="text-xs text-gray-400">SECURITY</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-sm text-gray-400 mb-1">Last Scanned Domain</div>
                <div className="font-mono text-sm text-white bg-gray-700/30 p-2 rounded-lg">
                  {stats.latestDomain || 'No scans yet'}
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-gray-400">Risk Level</div>
                  <div className={`text-sm font-bold ${stats.latestRisk >= 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {stats.latestRisk >= 50 ? '⚠️ High Risk' : '✅ Low Risk'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Threats Found</div>
                  <div className="text-sm font-bold text-orange-400">{alerts.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Threats - Only show REAL threats */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <span className="animate-pulse">🚨</span> Active Security Threats
        </h3>
        {alerts.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                onClick={() => {
                  setSelectedAlert(alert);
                  onThreatClick?.(alert);
                }}
                className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 hover:bg-red-900/30 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-white">{alert.domain}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="space-y-1">
                  {alert.threats?.slice(0, 3).map((threat, idx) => {
                    const severity = getThreatSeverity(threat);
                    return (
                      <div key={idx} className={`flex items-center gap-2 p-1 rounded ${severity.bgColor}`}>
                        <span>{severity.icon}</span>
                        <span className="text-xs text-gray-300 flex-1">{threat}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${severity.borderColor}`} style={{ color: severity.color }}>
                          {severity.level}
                        </span>
                      </div>
                    );
                  })}
                  {alert.threats && alert.threats.length > 3 && (
                    <div className="text-gray-400 text-xs mt-1">+{alert.threats.length - 3} more issues</div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBgColor(100 - alert.riskScore)}`}
                      style={{ width: `${100 - alert.riskScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">Risk: {alert.riskScore}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-gray-400">No active threats detected</div>
            <div className="text-xs text-gray-500 mt-1">All websites are secure</div>
          </div>
        )}
      </div>

      {/* Recent Scans - Only show scans with REAL issues */}
      {scans.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📋</span> Recent Security Scans
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Security Score</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Issues</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(0, 10).map((scan) => (
                  <tr key={scan._id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition">
                    <td className="px-4 py-2 text-sm text-gray-400">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-white">
                      {scan.domain}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-bold ${getScoreColor(scan.securityScore)}`}>
                        {scan.securityScore}/100
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        scan.riskScore >= 70 ? 'bg-red-900 text-red-300' :
                        scan.riskScore >= 50 ? 'bg-orange-900 text-orange-300' :
                        scan.riskScore >= 30 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {scan.riskScore >= 70 ? 'CRITICAL' :
                         scan.riskScore >= 50 ? 'HIGH' :
                         scan.riskScore >= 30 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-400">
                      {scan.threats?.length || 0} issues
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-md w-full mx-4 border border-red-500/50 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-red-400">Threat Details</h3>
                <button onClick={() => setSelectedAlert(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Domain</div>
                  <div className="font-mono text-sm text-white bg-black/30 p-2 rounded-lg">{selectedAlert.domain}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Risk Score</div>
                  <div className="text-2xl font-bold text-red-400">{selectedAlert.riskScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Threats Detected ({selectedAlert.threats?.length || 0})</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedAlert.threats?.map((threat, idx) => {
                      const severity = getThreatSeverity(threat);
                      return (
                        <div key={idx} className={`p-2 rounded-lg ${severity.bgColor} border-l-4 ${severity.borderColor}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{severity.icon}</span>
                            <span className="text-xs font-bold" style={{ color: severity.color }}>{severity.level}</span>
                          </div>
                          <div className="text-sm text-red-300">⚠️ {threat}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Time Detected</div>
                  <div className="text-sm text-gray-300">{new Date(selectedAlert.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.open(`http://localhost:3000`, '_blank')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 rounded-lg transition-all"
                >
                  View Dashboard
                </button>
                <button onClick={() => setSelectedAlert(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}