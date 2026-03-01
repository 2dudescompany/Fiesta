import { supabase } from "./supabase";

export async function injectUAT() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businesses) return;

  const businessId = businesses.id;

  // expose globals
  (window as any).HAVY_CLIENT_ID = businessId;
  (window as any).HAVY_SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL;
  (window as any).HAVY_SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (document.getElementById("havy-uat")) return;

  const script = document.createElement("script");
  script.id = "havy-uat";
  script.src = "/uat.js";
  script.defer = true;

  document.head.appendChild(script);
}