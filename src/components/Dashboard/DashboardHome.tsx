import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ThemedCard, ThemedStatCard } from "../common/ThemedCard";
import { useTimeTheme } from "../../hooks/useTimeTheme";

export default function DashboardHome() {
  const theme = useTimeTheme();
  const isDark = theme === "dark";

  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [nameGlow, setNameGlow] = useState(false);

  const [totalInteractions, setTotalInteractions] = useState(0);
  const [emailResponses, setEmailResponses] = useState(0);
  const [ttsConversions, setTtsConversions] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    setNameGlow(true);
    setTimeout(() => setNameGlow(false), 2000);

    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    /* -------------------------
       USER NAME
    ------------------------- */
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    setUserName(profile?.full_name || "User");

    /* -------------------------
       BUSINESS / CLIENT ID
    ------------------------- */
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_name")
      .eq("user_id", user.id)
      .single();

    if (!business) return;

    setBusinessName(business.business_name || "");
    const cid = business.id;

    const { data: recent } = await supabase
      .from("uat_events")
      .select("event_type, page_url, occurred_at")
      .eq("client_id", cid)
      .order("occurred_at", { ascending: false })
      .limit(5);

    setRecentEvents(recent || []);

    /* -------------------------
       TOTAL INTERACTIONS
    ------------------------- */
    const { count: interactionCount } = await supabase
      .from("uat_events")
      .select("*", { count: "exact", head: true })
      .eq("client_id", cid);

    setTotalInteractions(interactionCount || 0);

    /* -------------------------
       EMAIL LOG COUNT
    ------------------------- */
    const { count: emailCount } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", cid);

    setEmailResponses(emailCount || 0);

    /* -------------------------
       TTS EVENTS COUNT
    ------------------------- */
    const { count: ttsCount } = await supabase
      .from("tts_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setTtsConversions(ttsCount || 0);

    /* -------------------------
       ACTIVE USERS (24h)
    ------------------------- */
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: activeEvents } = await supabase
      .from("uat_events")
      .select("session_id")
      .eq("client_id", cid)
      .gte("occurred_at", yesterday.toISOString());

    const uniqueUsers = new Set(
      activeEvents?.map((e: any) => e.session_id)
    );

    setActiveUsers(uniqueUsers.size);

    /* -------------------------
       WEEKLY SERVICE USAGE (rolling 7-day window)
    ------------------------- */
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const { data: weeklyEvents } = await supabase
      .from("uat_events")
      .select("occurred_at")
      .eq("client_id", cid)
      .gte("occurred_at", last7Days.toISOString());

    // Build an ordered list of the last 7 dates as "MMM D" labels
    const rollingDays: { label: string; dateStr: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      rollingDays.push({ label, dateStr });
    }

    const counts: Record<string, number> = {};
    rollingDays.forEach(({ dateStr }) => (counts[dateStr] = 0));

    weeklyEvents?.forEach((e: any) => {
      const dateStr = new Date(e.occurred_at).toISOString().slice(0, 10);
      if (dateStr in counts) counts[dateStr]++;
    });

    const formatted = rollingDays.map(({ label, dateStr }) => ({
      day: label,
      interactions: counts[dateStr],
    }));

    setWeeklyData(formatted);
  }

  const videoSrc = isDark ? "/videos/nightvideo.mp4" : "/videos/dashboardday.mp4";
  const fallbackBg = isDark ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black" : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50";

  const axisColor = isDark ? "#ffffff55" : "#64748b";
  const tipStyle = isDark
    ? { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: "8px" }
    : { backgroundColor: "#fff", border: "1px solid #e2e8f0", color: "#1e293b", borderRadius: "8px" };

  return (
    <div className={`relative min-h-screen -m-8 overflow-hidden ${fallbackBg}`}>
      {/* Background video */}
      <video key={videoSrc} autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none">
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay keeps text readable */}
      <div className={`absolute inset-0 z-10 ${isDark ? 'bg-black/65' : 'bg-white/70'}`} />

      {/* Content */}
      <div className="relative z-20 p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {greeting},{" "}
            <span
              className={`bg-clip-text text-transparent inline-block ${nameGlow ? "animate-[shimmer_2s_infinite] bg-[linear-gradient(110deg,#2563eb,45%,#e2e8f0,55%,#0d9488)] bg-[length:200%_100%]" : "bg-gradient-to-r from-blue-600 to-teal-600"}`}
            >
              {userName}
              {businessName ? ` from ${businessName}` : ""}
            </span>
            !
          </h1>
          <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Here's what's happening with your AI services today.
          </p>
        </div>

        {/* Metrics */}
        <div className={`grid md:grid-cols-4 gap-4 [&>*]:transition-all [&>*]:duration-200 ${isDark ? '[&>*:hover]:shadow-[0_0_10px_rgba(59,130,246,0.3)]' : '[&>*:hover]:shadow-[0_0_10px_rgba(37,99,235,0.15)]'}`}>
          <ThemedStatCard label="Total Interactions" value={totalInteractions} />
          <ThemedStatCard label="Email Responses" value={emailResponses} accent />
          <ThemedStatCard label="TTS Conversions" value={ttsConversions} />
          <ThemedStatCard label="Active Users" value={activeUsers} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Usage */}
          <ThemedCard className="p-5 lg:col-span-2">
            <h2 className={`font-semibold mb-6 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
              Weekly Service Usage
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff15" : "#e2e8f0"} />
                <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
                <Tooltip contentStyle={tipStyle} />
                <Line
                  type="monotone"
                  dataKey="interactions"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ThemedCard>

          {/* Recent Activity */}
          <ThemedCard className="p-5">
            <h2 className={`font-semibold mb-6 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Recent Activity</h2>

            <div className="space-y-4">
              {recentEvents.length > 0 ? recentEvents.map((e, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 pb-3 ${i !== recentEvents.length - 1 ? (isDark ? 'border-b border-white/10' : 'border-b border-gray-100') : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <p className={`font-medium text-sm capitalize ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{e.event_type.replace('_', ' ')}</p>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {new Date(e.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {e.page_url}
                  </p>
                </div>
              )) : (
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>No recent interactions found.</p>
              )}
            </div>
          </ThemedCard>
        </div>

      </div>
    </div>
  );
}
