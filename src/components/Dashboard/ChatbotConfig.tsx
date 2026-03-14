import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Copy, Check, Code, Globe, RefreshCw, Trash2, AlertCircle,
  CheckCircle2, TrendingUp, MessageSquareX, BarChart2, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DownloadReportButton from '../common/DownloadReportButton';
import { useTimeTheme } from '../../hooks/useTimeTheme';

interface StatCardProps { label: string; value: string | number; sub?: string; color?: string; }
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = '#6366f1' }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm">
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const ChatbotConfig: React.FC = () => {
  const { user } = useAuth();
  const theme = useTimeTheme();
  const isDark = theme === 'dark';

  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Scraper state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState(1);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{ pages: number; chunks: number } | null>(null);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapedInfo, setScrapedInfo] = useState<{ count: number; lastAt: string } | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);
  const [bizName, setBizName] = useState('');
  const [chatbotKey, setChatbotKey] = useState('');

  // FAQ / stats state
  const [faqStats, setFaqStats] = useState<any[]>([]);
  const [faqSummary, setFaqSummary] = useState({ total: 0, matched: 0 });
  const [lowConfidence, setLowConfidence] = useState<any[]>([]);
  const [deadQueries, setDeadQueries] = useState<any[]>([]);
  const [sourcePie, setSourcePie] = useState<any[]>([]);
  const [dailyChart, setDailyChart] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, chatbot_key')
      .eq('user_id', user.id)
      .single();
    if (!biz) return;
    setBizId(biz.id);
    setBizName(biz.name || '');
    setChatbotKey(biz.chatbot_key || '');
    await Promise.all([loadFaqAnalytics(biz.id), loadScrapedInfo(biz.id)]);
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('chatbot_config');
    if (saved) {
      try {
        const cfg = JSON.parse(saved);
        if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
        if (cfg.position) setPosition(cfg.position);
      } catch { /**/ }
    }
    loadAll();
  }, [loadAll]);

  /* ── Scraper ──────────────────────────────────────────────────── */
  const loadScrapedInfo = async (id: string) => {
    const { data, count } = await supabase
      .from('scraped_pages')
      .select('scraped_at', { count: 'exact' })
      .eq('business_id', id)
      .order('scraped_at', { ascending: false })
      .limit(1);
    setScrapedInfo(count && count > 0 && data?.[0]
      ? { count: count, lastAt: data[0].scraped_at } : null);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim() || !bizId) return;
    setScraping(true); setScrapeResult(null); setScrapeError('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-site`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: scrapeUrl.trim(), business_id: bizId, crawl_depth: crawlDepth }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Scrape failed');
      setScrapeResult({ pages: json.pages_crawled, chunks: json.chunks_stored });
      await loadScrapedInfo(bizId);
    } catch (err: any) {
      setScrapeError(err.message);
    } finally { setScraping(false); }
  };

  const handleClearScrape = async () => {
    if (!bizId) return;
    await supabase.from('scraped_pages').delete().eq('business_id', bizId);
    setScrapedInfo(null); setScrapeResult(null);
  };

  /* ── FAQ + New Stats ─────────────────────────────────────────── */
  const loadFaqAnalytics = async (id: string) => {
    try {
      const { data } = await supabase
        .from('faq_logs')
        .select('question, matched, similarity_score, answer, created_at')
        .eq('business_id', id)
        .order('created_at', { ascending: true });

      if (!data) return;

      // Basic summary
      const counts: Record<string, number> = {};
      let matched = 0; let totalScore = 0; const lowConf: any[] = [];
      // Source breakdown
      let faqHits = 0, scrapedHits = 0, noAnswer = 0;
      // Dead queries
      const deadMap: Record<string, number> = {};
      // Daily chart (last 30 days)
      const dayMap: Record<string, number> = {};
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);

      data.forEach((row: any) => {
        counts[row.question] = (counts[row.question] || 0) + 1;
        totalScore += row.similarity_score || 0;
        if (row.matched) { matched++; faqHits++; }
        else if (row.answer) { scrapedHits++; }
        else { noAnswer++; deadMap[row.question] = (deadMap[row.question] || 0) + 1; }
        if ((row.similarity_score || 0) < 0.3) lowConf.push(row);
        // daily
        if (row.created_at && new Date(row.created_at) >= cutoff) {
          const day = row.created_at.slice(0, 10);
          dayMap[day] = (dayMap[day] || 0) + 1;
        }
      });

      setFaqSummary({ total: data.length, matched });
      setAvgScore(data.length > 0 ? Math.round((totalScore / data.length) * 100) / 100 : null);
      setFaqStats(
        Object.entries(counts)
          .map(([question, count]) => ({ question, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5)
      );
      setLowConfidence(lowConf.slice(0, 5));
      setDeadQueries(
        Object.entries(deadMap)
          .map(([q, c]) => ({ question: q, count: c }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      );
      setSourcePie([
        { name: 'FAQ Hit', value: faqHits },
        { name: 'Scraped Page', value: scrapedHits },
        { name: 'No Answer', value: noAnswer },
      ].filter(d => d.value > 0));
      setDailyChart(Object.entries(dayMap).map(([day, queries]) => ({ day: day.slice(5), queries })));
    } catch { /**/ }
  };

  const handleSave = () => {
    localStorage.setItem('chatbot_config', JSON.stringify({ primaryColor, position }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const generateSnippet = () => {
    const origin = window.location.origin;
    return `<!-- HAVY Chatbot + UAT Widget -->
<script>
(function(){
  window.HAVYChatbotConfig = {
    chatbotKey: '${chatbotKey || 'YOUR_CHATBOT_KEY'}',
    businessName: '${bizName || 'Your Business'}',
    position: '${position}',
    primaryColor: '${primaryColor}',
    havyOrigin: '${origin}',
    supabaseUrl: '${import.meta.env.VITE_SUPABASE_URL}',
    anonKey: '${import.meta.env.VITE_SUPABASE_ANON_KEY}',
  };
  window.HAVY_CLIENT_ID = '${bizId || 'YOUR_BUSINESS_ID'}';
  window.HAVY_SUPABASE_URL = '${import.meta.env.VITE_SUPABASE_URL}';
  window.HAVY_SUPABASE_ANON_KEY = '${import.meta.env.VITE_SUPABASE_ANON_KEY}';

  var s = document.createElement('script');
  s.src = '${origin}/chatbot-widget.js'; s.defer = true;
  document.head.appendChild(s);

  var u = document.createElement('script');
  u.src = '${origin}/uat.js'; u.defer = true;
  document.head.appendChild(u);
})();
</script>`;
  };

  const tipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }
    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b' };

  const matchRate = faqSummary.total
    ? Math.round((faqSummary.matched / faqSummary.total) * 100) : 0;

  return (
    <div className="space-y-6" id="chatbotExport">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analytics, scraping, appearance &amp; embed code</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <DownloadReportButton targetId="chatbotExport" fileName="chatbot-report.pdf" />
        </div>
      </div>

      {/* ── Chatbot Health KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Questions" value={faqSummary.total} sub="all time" />
        <StatCard label="FAQ Match Rate" value={`${matchRate}%`} color="#10b981"
          sub={`${faqSummary.matched} matched`} />
        <StatCard label="Dead Queries" value={deadQueries.length}
          color={deadQueries.length > 3 ? '#ef4444' : '#f59e0b'}
          sub="no answer found" />
        <StatCard label="Avg Similarity" value={avgScore !== null ? avgScore.toFixed(2) : '—'}
          color="#6366f1" sub="FAQ score" />
      </div>

      {/* ── Source Breakdown + Daily Chart ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Answer Source Breakdown
          </h3>
          {sourcePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sourcePie} dataKey="value" nameKey="name" outerRadius={70}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                  {sourcePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400">No data yet.</p>}
        </div>

        <div className="card p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Daily Activity (30 days)
          </h3>
          {dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyChart}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={tipStyle} />
                <Line type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400">No recent activity.</p>}
        </div>
      </div>

      {/* ── Dead Queries ─────────────────────────────────────────────── */}
      {deadQueries.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <MessageSquareX className="w-4 h-4 text-red-400" /> Dead Queries — Add These to FAQs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {deadQueries.map((q, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm">
                <span className="text-gray-700 truncate flex-1 mr-2">{q.question}</span>
                <span className="text-red-500 font-semibold text-xs whitespace-nowrap">×{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top FAQs + Low Confidence ──────────────────────────────── */}
      <div className="card p-5 space-y-4" id="analyticsExport">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" /> FAQ Analytics
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border shadow-sm">
            <p className="text-xs text-gray-500">Total Queries</p>
            <p className="text-2xl font-bold text-gray-900">{faqSummary.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-white border shadow-sm">
            <p className="text-xs text-gray-500">Matched</p>
            <p className="text-2xl font-bold text-green-600">{faqSummary.matched}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-white border shadow-sm">
            <p className="text-xs text-gray-500">Match Rate</p>
            <p className="text-2xl font-bold text-purple-600">{matchRate}%</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Top Asked Questions</h3>
          <div className="space-y-1.5">
            {faqStats.map((q: any, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2.5 rounded-lg border bg-white hover:bg-gray-50 transition text-sm shadow-sm">
                <span className="text-gray-700 truncate max-w-[80%]">{q.question}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">{q.count}</span>
              </div>
            ))}
            {faqStats.length === 0 && <p className="text-gray-400 text-sm">No data yet.</p>}
          </div>
        </div>

        {lowConfidence.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Low Confidence Queries</h3>
            <div className="space-y-1.5">
              {lowConfidence.map((q: any, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 border rounded-lg bg-amber-50 text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2">{q.question}</span>
                  <span className="text-amber-600 text-xs font-medium whitespace-nowrap">
                    score: {(q.similarity_score || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Scrape My Site ──────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">Smart Scraper — Index My Website</h2>
        </div>
        <p className="text-sm text-gray-500">
          The chatbot uses scraped content to answer questions not covered by FAQs.
        </p>

        {scrapedInfo && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span><strong>{scrapedInfo.count}</strong> chunks indexed · last scraped {new Date(scrapedInfo.lastAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button onClick={handleClearScrape} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input type="url" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm transition" />
          <select value={crawlDepth} onChange={e => setCrawlDepth(Number(e.target.value))}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400">
            <option value={0}>Home only</option>
            <option value={1}>+1 level</option>
            <option value={2}>+2 levels</option>
          </select>
        </div>

        <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium">
          <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
          {scraping ? 'Scraping…' : 'Scrape Now'}
        </button>

        {scrapeResult && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
            <CheckCircle2 className="w-4 h-4" />
            Done! Crawled <strong>{scrapeResult.pages}</strong> pages → stored <strong>{scrapeResult.chunks}</strong> chunks.
          </div>
        )}
        {scrapeError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4" /> {scrapeError}
          </div>
        )}
      </div>

      {/* ── Widget Appearance ─────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Widget Appearance</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Primary Colour</label>
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            className="w-16 h-10 border rounded cursor-pointer" />
          <span className="text-sm text-gray-500">{primaryColor}</span>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Position</label>
          <select value={position} onChange={e => setPosition(e.target.value as any)}
            className="w-full px-4 py-2 border rounded-lg">
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      {/* ── Embed Code ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Embed Code Snippet</h2>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(generateSnippet()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
            {copied ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Paste into the <code>&lt;head&gt;</code> of your client website. The GIF icon, FAQ, and UAT tracking all load from <strong>HAVY's origin</strong> automatically.
        </p>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap">
            <code>{generateSnippet()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConfig;
