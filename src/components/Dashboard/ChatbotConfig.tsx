import React, { useState, useEffect } from 'react';
import { Save, Copy, Check, Code } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DownloadReportButton from '../common/DownloadReportButton';

const ChatbotConfig: React.FC = () => {
  const { user } = useAuth();

  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [faqStats, setFaqStats] = useState<any[]>([]);
  const [faqSummary, setFaqSummary] = useState({ total: 0, matched: 0 });
  const [lowConfidence, setLowConfidence] = useState<any[]>([]);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('chatbot_config');
    if (saved) {
      try {
        const cfg = JSON.parse(saved);
        if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
        if (cfg.position) setPosition(cfg.position);
      } catch { /* ignore */ }
    }
    loadFaqAnalytics();
  }, []);

  /* ---------- FAQ Analytics ---------- */
  const loadFaqAnalytics = async () => {
    try {
      if (!user) return;

      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!biz) return;

      const { data, error } = await supabase
        .from('faq_logs')
        .select('question, matched, similarity_score')
        .eq('business_id', biz.id);

      if (error || !data) return;

      const counts: Record<string, number> = {};
      let matched = 0;
      const lowConf: any[] = [];
      let totalScore = 0;

      data.forEach((row: any) => {
        counts[row.question] = (counts[row.question] || 0) + 1;
        if (row.matched) matched++;
        totalScore += row.similarity_score || 0;
        if ((row.similarity_score || 0) < 0.3) lowConf.push(row);
      });

      setFaqStats(
        Object.entries(counts)
          .map(([question, count]) => ({ question, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5)
      );
      setFaqSummary({ total: data.length, matched });
      setLowConfidence(lowConf.slice(0, 5));
    } catch {
      /* fail silently */
    }
  };

  /* ---------- Save Config ---------- */
  const handleSave = () => {
    localStorage.setItem('chatbot_config', JSON.stringify({ primaryColor, position }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ---------- Embed Snippet ---------- */
  const generateSnippet = () => {
    const userId = user?.id || 'user';
    return `<!-- HAVY UAT + Chatbot Widget -->
<script>
(function(){
  window.HAVYChatbotConfig = {
    userId: '${userId}',
    position: '${position}',
    primaryColor: '${primaryColor}',
  };
  window.HAVY_CLIENT_ID   = 'YOUR_BUSINESS_ID';
  window.HAVY_SUPABASE_URL = '${import.meta.env.VITE_SUPABASE_URL}';
  window.HAVY_SUPABASE_ANON_KEY = '${import.meta.env.VITE_SUPABASE_ANON_KEY}';

  // UAT tracking
  var uatScript = document.createElement('script');
  uatScript.src = '${window.location.origin}/uat.js';
  uatScript.defer = true;
  document.head.appendChild(uatScript);
})();
</script>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─────────── UI ─────────── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
        <p className="text-gray-600">Configure your chatbot widget appearance and view FAQ analytics</p>
      </div>

      {/* FAQ Analytics */}
      <div className="card space-y-6">
        <div id="analyticsExport">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">FAQ Analytics</h2>
            <button
              onClick={loadFaqAnalytics}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Refresh
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-white border shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Queries</p>
              <p className="text-3xl font-bold text-gray-900">{faqSummary.total}</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-white border shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Matched</p>
              <p className="text-3xl font-bold text-green-600">{faqSummary.matched}</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-white border shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Match Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {faqSummary.total
                  ? Math.round((faqSummary.matched / faqSummary.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Top questions */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Top Asked Questions</h3>
            <div className="space-y-2">
              {faqStats.map((q: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition shadow-sm"
                >
                  <span className="text-gray-700 truncate max-w-[80%]">{q.question}</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {q.count}
                  </span>
                </div>
              ))}
              {faqStats.length === 0 && (
                <p className="text-gray-500 text-sm">No analytics data yet.</p>
              )}
            </div>
          </div>

          {/* Low confidence */}
          {lowConfidence.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Low Confidence Queries</h3>
              <div className="space-y-2">
                {lowConfidence.map((q: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg bg-orange-50">
                    <p className="text-sm text-gray-700">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DownloadReportButton targetId="analyticsExport" fileName="chatbot-analytics.pdf" />
      </div>

      {/* Widget Appearance */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Widget Appearance</h2>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Primary Colour</label>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-16 h-10 border rounded cursor-pointer"
          />
          <span className="text-sm text-gray-500">{primaryColor}</span>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'bottom-right' | 'bottom-left')}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>

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
            <h2 className="text-lg font-semibold">Embed Code Snippet</h2>
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
        <p className="text-sm text-gray-500 mb-3">
          Paste this into the <code>&lt;head&gt;</code> of your client website. Replace{' '}
          <code>YOUR_BUSINESS_ID</code> with the UUID from your Business Profile page.
        </p>
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
