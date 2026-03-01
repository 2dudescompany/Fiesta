import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DownloadReportButton from "../common/DownloadReportButton";

// ---------------- TYPES ---------------- //

type UATStat = {
  tag: string;
  text_content: string | null;
  page_url: string;
  click_count: number;
  hover_count: number;
};

type HeatmapCell = {
  date: string;
  hour: number;
  interactions: number;
};

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

// ---------------- COMPONENT ---------------- //

export default function UATAnalytics() {
  const [data, setData] = useState<UATStat[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);

  const [insight, setInsight] = useState("");
  const [ctaScore, setCtaScore] = useState<number | null>(null);

  // ---------------- FETCH DATA ---------------- //

 async function fetchUATStats() {
  // 1️⃣ Get logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // 2️⃣ Get business linked to user
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) return;

  // 3️⃣ Fetch events using business.id
  const { data: events, error } = await supabase
    .from("uat_events")
    .select("tag, text_content, page_url, event_type")
    .eq("client_id", business.id);

  if (error || !events) return;

  const map: Record<string, UATStat> = {};

  events.forEach((e: any) => {
    const key = `${e.tag}-${e.text_content}-${e.page_url}`;

    if (!map[key]) {
      map[key] = {
        tag: e.tag,
        text_content: e.text_content,
        page_url: e.page_url,
        click_count: 0,
        hover_count: 0,
      };
    }

    if (e.event_type === "click") map[key].click_count++;
    if (e.event_type === "hover") map[key].hover_count++;
  });

  const stats = Object.values(map)
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 20);

  setData(stats);
}

  async function fetchHeatmap() {
    const { data } = await supabase
      .from("uat_hourly_heatmap")
      .select("*")
     //commented only for until review .eq("client_id", window.HAVY_CLIENT_ID);

    setHeatmap(data || []);
  }

  useEffect(() => {
    (async () => {
      await fetchUATStats();
      await fetchHeatmap();
      setLoading(false);
    })();
  }, []);

  // ---------------- AI INSIGHT + CTA SCORE ---------------- //

  useEffect(() => {
    if (data.length === 0) return;

    const totalClicks = data.reduce((a, b) => a + b.click_count, 0);
    const totalHovers = data.reduce((a, b) => a + b.hover_count, 0);

    const score =
      totalClicks === 0
        ? 0
        : Math.min(
            (totalClicks / (totalClicks + totalHovers)) * 100,
            100
          );

    setCtaScore(Math.round(score));

    let msg = "";

    if (totalHovers > totalClicks * 3) {
      msg =
        "Users explore many elements but rarely click. This indicates UI confusion or weak calls-to-action.";
    } else if (totalClicks > totalHovers) {
      msg =
        "Users actively click UI elements. Calls-to-action and navigation hierarchy are effective.";
    } else {
      msg =
        "Users show balanced hover and click behavior. Consider improving visual emphasis on key actions.";
    }

    const top = data[0];
    msg += ` The most interacted element is "${
      top.text_content || top.tag
    }" on ${top.page_url}.`;

    setInsight(msg);
  }, [data]);

  // ---------------- EMPTY STATES ---------------- //

  if (loading)
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-600 font-medium animate-pulse">
          Loading analytics...
        </p>

      </div>
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="p-6 text-gray-500">
        <h2 className="text-xl font-semibold mb-2">
          UAT Analytics
        </h2>
        <p>No user attention data available yet.</p>
        <p className="text-sm mt-2">
          Embed UAT on a client website and generate interactions.
        </p>
      </div>
    );
  }

  // ---------------- PIE DATA ---------------- //

  const pieData = data.map((d) => ({
    name: d.text_content || d.tag,
    value: d.click_count,
  }));

  // ---------------- HEATMAP PROCESSING ---------------- //

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dates = [...new Set(heatmap.map((h) => h.date))];

  function getValue(date: string, hour: number) {
    return (
      heatmap.find(
        (h) => h.date === date && h.hour === hour
      )?.interactions || 0
    );
  }

  // ---------------- UI ---------------- //

  return (
    <div className="space-y-8" id="analyticsExport">
      <h2 className="text-xl font-semibold">UAT Analytics</h2>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">
            Tracked Elements
          </p>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">
            Total Clicks
          </p>
          <p className="text-2xl font-bold">
            {data.reduce((a, b) => a + b.click_count, 0)}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">
            Total Hovers
          </p>
          <p className="text-2xl font-bold">
            {data.reduce((a, b) => a + b.hover_count, 0)}
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-gray-500">
            CTA Effectiveness
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {ctaScore}%
          </p>
        </div>
      </div>

      {/* AI INSIGHT */}
      {insight && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          💡 <strong>AI Insight:</strong> {insight}
        </div>
      )}

      {/* BAR CHART */}
      <div className="h-80 border rounded-lg p-4">
        <h3 className="font-medium mb-2">
          Top Interacted Elements
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="text_content" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="click_count" radius={[4, 4, 0, 0]} fill="#3076ac" />
            <Bar dataKey="hover_count" radius={[4, 4, 0, 0]} fill="#182d58"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PIE CHART */}
      <div className="h-80 border rounded-lg p-4">
        <h3 className="font-medium mb-2">
          Click Distribution
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label
            >
              {pieData.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* HEATMAP */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-medium mb-2">
          User Interaction Heatmap (by Hour)
        </h3>

        <div className="overflow-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-1">Date</th>
                {hours.map((h) => (
                  <th key={h} className="p-1">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dates.map((date) => (
                <tr key={date}>
                  <td className="p-1 text-gray-600">
                    {new Date(
                      date + "T00:00:00"
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>

                  {hours.map((h) => {
                    const val = getValue(date, h);
                    return (
                      <td
                        key={h}
                        className="w-6 h-6 border"
                        style={{
                          backgroundColor: `rgba(37, 99, 235, ${Math.min(
                            val / 50,
                            1
                          )})`,
                        }}
                        title={`${val} interactions`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs">
          <span>Low</span>
          <div className="w-4 h-4 bg-blue-100"></div>
          <div className="w-4 h-4 bg-blue-300"></div>
          <div className="w-4 h-4 bg-blue-600"></div>
          <span>High</span>
        </div>
      </div>
    <DownloadReportButton targetId="analyticsExport" fileName="analytics-report.pdf"/>
    </div>
  );
}
