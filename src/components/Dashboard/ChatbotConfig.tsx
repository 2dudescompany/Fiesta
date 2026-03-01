import React, { useState, useEffect } from 'react';
import { Save, Copy, Check, Code, AlertCircle} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { rasaService } from '../../lib/rasa';
import { exportPageToPDF } from "../../lib/exportPDF";
import DownloadReportButton from "../common/DownloadReportButton";

const ChatbotConfig: React.FC = () => {
  const { user } = useAuth();

  const [rasaServerUrl, setRasaServerUrl] = useState(
    import.meta.env.VITE_RASA_SERVER_URL || 'http://localhost:5005'
  );
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [position, setPosition] =
    useState<'bottom-right' | 'bottom-left'>('bottom-right');

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverStatus, setServerStatus] =
    useState<'checking' | 'online' | 'offline'>('checking');

  const [faqStats, setFaqStats] = useState<any[]>([]);
  const [faqSummary, setFaqSummary] = useState({
    total: 0,
    matched: 0,
  });

  const [avgConfidence, setAvgConfidence] = useState(0);
  const [lowConfidence, setLowConfidence] = useState<any[]>([]);


  /* ---------- Server Health ---------- */

  useEffect(() => {
    checkServerStatus();
    loadFaqAnalytics();
  }, [rasaServerUrl]);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    const healthy = await rasaService.checkHealth();
    setServerStatus(healthy ? 'online' : 'offline');
  };

  /* ---------- Save Config ---------- */

  const handleSave = () => {
    localStorage.setItem(
      'chatbot_config',
      JSON.stringify({
        rasaServerUrl,
        primaryColor,
        position,
      })
    );

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ---------- Embed Snippet ---------- */

  const generateSnippet = () => {
    const userId = user?.id || 'user';
    const savedConfig = JSON.parse(
      localStorage.getItem('chatbot_config') || '{}'
    );

    return `<!-- HAVY Chatbot Widget -->
<div id="havy-chatbot-root"></div>
<script>
(function(){
  window.HAVYChatbotConfig = {
    rasaServerUrl: '${rasaServerUrl}',
    userId: '${userId}',
    position: '${position}',
    primaryColor: '${primaryColor}',
    chatbotKey: '${savedConfig.chatbot_key || ''}'
  };

  var script = document.createElement('script');
  script.src = '${window.location.origin}/chatbot-widget.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ---------- UI ---------- */

  const loadFaqAnalytics = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/faq_logs?select=question,matched`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();

      const counts: Record<string, number> = {};
      let matched = 0;

      data.forEach((row: any) => {
        counts[row.question] =
          (counts[row.question] || 0) + 1;

        if (row.matched) matched++;
      });

      const sorted = Object.entries(counts)
        .map(([question, count]) => ({ question, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      setFaqStats(sorted);
      setFaqSummary({
        total: data.length,
        matched,
      });

      let totalScore = 0;
      let lowConf: any[] = [];

      data.forEach((row: any) => {
        counts[row.question] =
          (counts[row.question] || 0) + 1;

        if (row.matched) matched++;

        totalScore += row.similarity_score || 0;

        if ((row.similarity_score || 0) < 0.3) {
          lowConf.push(row);
        }
      });

      const avg =
        data.length > 0
          ? totalScore / data.length
          : 0;

      setAvgConfidence(avg);

      setLowConfidence(lowConf.slice(0, 5));

    } catch (e) {
      console.error("Analytics load failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Chatbot Configuration
        </h1>
        <p className="text-gray-600">
          Configure your Rasa-powered chatbot widget
        </p>
      </div>

    {/* FAQ Analytics */}
    <div className="card space-y-6">
      <div id="analyticsExport">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          FAQ Analytics
        </h2>

        <button
          onClick={loadFaqAnalytics}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-white border shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Queries</p>
          <p className="text-3xl font-bold text-gray-900">
            {faqSummary.total}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-white border shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Matched Queries</p>
          <p className="text-3xl font-bold text-green-600">
            {faqSummary.matched}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-white border shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Match Rate</p>
          <p className="text-3xl font-bold text-purple-600">
            {faqSummary.total
              ? Math.round(
                  (faqSummary.matched /
                    faqSummary.total) *
                    100
                )
              : 0}
            %
          </p>
        </div>

       {/* <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-white border shadow-sm">
        <p className="text-sm text-gray-500 mb-1">
          Avg Confidence
        </p>
        <p className="text-3xl font-bold text-orange-600">
          {(avgConfidence * 100).toFixed(3)}%
        </p>
      </div> */}

      </div>

      {/* Top questions */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Top Asked Questions
        </h3>

        <div className="space-y-2">
          {faqStats.map((q: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition shadow-sm"
            >
              <span className="text-gray-700 truncate max-w-[80%]">
                {q.question}
              </span>

              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                {q.count}
              </span>
            </div>
          ))}

          {faqStats.length === 0 && (
            <p className="text-gray-500 text-sm">
              No analytics data yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">
          Low Confidence Queries
        </h3>

        <div className="space-y-2">
          {lowConfidence.map((q: any, i: number) => (
            <div
              key={i}
              className="p-3 border rounded-lg bg-orange-50"
            >
              <p className="text-sm text-gray-700">
                {q.question}
              </p>
              {/*<p className="text-xs text-gray-500">
                Score: {(q.similarity_score * 100).toFixed(0)}%
              </p>*/}
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
    <DownloadReportButton targetId="analyticsExport" fileName="analytics-report.pdf"/>

      {/* Server Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Rasa Server Status
          </h2>

          <button
            onClick={checkServerStatus}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {serverStatus === 'checking' && (
            <>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              <span>Checking server status...</span>
            </>
          )}

          {serverStatus === 'online' && (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-600">Server Online</span>
            </>
          )}

          {serverStatus === 'offline' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600">
                Server Offline
              </span>
            </>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="card space-y-4">
        <input
          type="text"
          value={rasaServerUrl}
          onChange={(e) => setRasaServerUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />

        <input
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="w-16 h-10 border rounded"
        />

        <select
          value={position}
          onChange={(e) =>
            setPosition(
              e.target.value as 'bottom-right' | 'bottom-left'
            )
          }
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
        </select>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Embed Code */}
      <div className="card">
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              Embed Code Snippet
            </h2>
          </div>

          <button
            onClick={copySnippet}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-green-400 text-sm overflow-x-auto">
            <code>{generateSnippet()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConfig;
