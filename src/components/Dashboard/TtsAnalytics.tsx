import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import DownloadReportButton from "../common/DownloadReportButton";

const COLORS = ['#2563eb', '#16a34a'];

type TriggerType = 'hover' | 'click';

type HeatmapRow = {
  date: string;
  hours: Record<number, number>;
};

export default function TtsAnalytics() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [summary, setSummary] = useState<{
    totalEvents: number;
    totalWords: number;
    avgWords: string | number;
  } | null>(null);

  const [hoverClick, setHoverClick] = useState<
    { name: string; value: number }[]
  >([]);

  const [usageOverTime, setUsageOverTime] = useState<HeatmapRow[]>([]);

  const [topWords, setTopWords] = useState<
    { word: string; count: number }[]
  >([]);

  const [intentScore, setIntentScore] = useState<number>(0);


  useEffect(() => {
    loadAnalytics();
  }, [selectedDate]);

  function buildHeatmapData(events: any[]): HeatmapRow[] {
    const map: Record<string, Record<number, number>> = {};

    events.forEach(e => {
      const date = e.created_at.slice(0, 10);
      const hour = new Date(e.created_at).getHours();

      if (!map[date]) map[date] = {};
      map[date][hour] = (map[date][hour] || 0) + 1;
    });

    return Object.entries(map).map(([date, hours]) => ({
      date,
      hours,
    }));
  }

  async function loadAnalytics() {
    /* 1️⃣ GET CURRENT USER */
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    /* 2️⃣ FETCH EVENTS – scoped to this user */
    const { data: events } = await supabase
      .from('tts_events')
      .select('trigger_type, word_count, created_at')
      .eq('user_id', user.id);

    if (!events) return;

    /* 2️⃣ SUMMARY */
    const totalEvents = events.length;
    const totalWords = events.reduce(
      (sum, e) => sum + (e.word_count || 0),
      0
    );

    setSummary({
      totalEvents,
      totalWords,
      avgWords: totalEvents
        ? (totalWords / totalEvents).toFixed(1)
        : 0,
    });

    /* 3️⃣ HOVER vs CLICK (DATE-BASED) */
    const hc: Record<TriggerType, number> = {
      hover: 0,
      click: 0,
    };

    events.forEach(e => {
      const type = e.trigger_type as TriggerType;
      if (
        (type === 'hover' || type === 'click') &&
        e.created_at.startsWith(selectedDate)
      ) {
        hc[type]++;
      }
    });

    setHoverClick([
      { name: 'Hover', value: hc.hover },
      { name: 'Click', value: hc.click },
    ]);

    /* 4️⃣ CLICK INTENT SCORE */
    setIntentScore(
      totalEvents ? Math.round((hc.click / totalEvents) * 100) : 0
    );

    /* 5️⃣ TTS USAGE OVER TIME (HEATMAP DATA) */
    setUsageOverTime(buildHeatmapData(events));

    /* 6️⃣ WORD-LEVEL ANALYTICS */
    const { data: words } = await supabase
      .from('tts_word_stats')
      .select('word, trigger_type, count')
      .eq('user_id', user.id);

    if (!words) return;

    const wordMap: Record<string, { hover: number; click: number }> = {};

    words.forEach(w => {
      const type = w.trigger_type as TriggerType;
      if (!wordMap[w.word]) {
        wordMap[w.word] = { hover: 0, click: 0 };
      }
      if (type === 'hover' || type === 'click') {
        wordMap[w.word][type] += w.count;
      }
    });

    /* 7️⃣ TOP SPOKEN WORDS */
    setTopWords(
      Object.entries(wordMap)
        .map(([word, v]) => ({
          word,
          count: v.hover + v.click,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

  }

  if (!summary) return <p>Loading TTS analytics...</p>;

  return (
    <div className="space-y-8" id="analyticsExport">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Stat title="TTS Events" value={summary.totalEvents} />
        <Stat title="Words Spoken" value={summary.totalWords} />
        <Stat title="Avg Words / Use" value={summary.avgWords} />
        <Stat title="Click Intent %" value={`${intentScore}%`} />
      </div>

      {/* Hover vs Click */}
      <Card title="Hover vs Click Usage">
        <div className="flex justify-end mb-3">
          <input type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        {hoverClick.every(d => d.value === 0) ? (
          <p className="text-gray-500 text-sm">No TTS activity on this date</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={hoverClick} dataKey="value" nameKey="name" label>
                {hoverClick.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>


      {/* Usage over time */}
      <Card title="TTS Usage Heatmap (by Hour)">
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left">Date</th>
                {Array.from({ length: 24 }).map((_, h) => (
                  <th key={h} className="p-1 text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usageOverTime.map((row: any) => (
                <tr key={row.date}>
                  <td className="p-2 font-medium">{row.date}</td>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const value = row.hours[h] || 0;
                    const intensity = Math.min(value * 20, 255);
                    return (
                      <td
                        key={h}
                        title={`${value} interactions`}
                        className="w-6 h-6"
                        style={{
                          backgroundColor: value
                            ? `rgba(37,99,235,${intensity / 255})`
                            : '#f1f5f9',
                        }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>


      {/* Top Words */}
      <Card title="Top Spoken Words">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={topWords}
            margin={{ top: 20, right: 20, left: 20, bottom: 90 }}
          >
            <XAxis
              dataKey="word"
              interval={0}
              angle={-45}
              textAnchor="end"
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>


      {/* Engaged Words */}
      {/* <Card title="Most Engaged Words">
        <ResponsiveContainer
            width="100%"
            height={Math.max(engagedWords.length * 40, 300)}
        >
            <BarChart
            data={engagedWords}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
            >
            <XAxis type="number" />
            <YAxis
                type="category"
                dataKey="word"
                width={80}
                tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="score" fill="#2563eb" />
            </BarChart>
        </ResponsiveContainer>
        </Card> */}
      <DownloadReportButton targetId="analyticsExport" fileName="analytics-report.pdf" />
    </div>
  );
}

/* Small UI helpers */

function Stat({ title, value }: { title: string; value: any }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
