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

export default function DashboardHome() {
  const [userName, setUserName] = useState("");

  const [totalInteractions, setTotalInteractions] = useState(0);
  const [emailResponses, setEmailResponses] = useState(0);
  const [ttsConversions, setTtsConversions] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
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
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) return;

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
       WEEKLY SERVICE USAGE
    ------------------------- */
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);

    const { data: weeklyEvents } = await supabase
      .from("uat_events")
      .select("occurred_at")
      .eq("client_id", cid)
      .gte("occurred_at", last7Days.toISOString());

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {};

    days.forEach((d) => (counts[d] = 0));

    weeklyEvents?.forEach((e: any) => {
      const d = days[new Date(e.occurred_at).getDay()];
      counts[d]++;
    });

    const formatted = days.map((d) => ({
      day: d,
      interactions: counts[d],
    }));

    setWeeklyData(formatted);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-500">
          Here's what's happening with your AI services today.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="Total Interactions" value={totalInteractions} />
        <StatCard title="Email Responses" value={emailResponses} />
        <StatCard title="TTS Conversions" value={ttsConversions} />
        <StatCard title="Active Users" value={activeUsers} />
      </div>

      {/* Weekly Usage */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          Weekly Service Usage
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="interactions"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Recent Activity</h2>

        <div className="space-y-3">
          {recentEvents.map((e, i) => (
            <div
              key={i}
              className="flex justify-between text-sm border-b pb-2"
            >
              <div>
                <p className="font-medium">{e.event_type}</p>
                <p className="text-gray-500 truncate max-w-md">
                  {e.page_url}
                </p>
              </div>

              <span className="text-gray-400">
                {new Date(e.occurred_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold mt-1">
        {value.toLocaleString()}
      </h3>
    </div>
  );
}
