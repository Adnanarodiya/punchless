import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckinRequest {
  latitude: number;
  longitude: number;
  employee_id: string;
}

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client with service role key or auth header
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user from auth header to verify token validity
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request payload
    const { latitude, longitude, employee_id } = (await req.json()) as CheckinRequest;
    
    // Ensure the auth user matches the employee_id being updated (or is an admin/owner)
    if (user.id !== employee_id) {
      // Check if user is owner/admin
      const { data: currentUserProfile } = await supabaseClient
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (!currentUserProfile || (currentUserProfile.role !== "owner" && currentUserProfile.role !== "admin")) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot check-in for another employee" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Fetch employee profile to get their company_id
    const { data: profile, error: profileError } = await supabaseClient
      .from("users")
      .select("company_id")
      .eq("id", employee_id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile?.company_id) {
      return new Response(JSON.stringify({ error: "Employee profile or company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch active workshops for that company
    const { data: workshops, error: workshopsError } = await supabaseClient
      .from("workshops")
      .select("id, name, lat, lng, radius")
      .eq("is_active", true)
      .is("deleted_at", null);

    if (workshopsError || !workshops) {
      return new Response(JSON.stringify({ error: "Failed to fetch workshops" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Check if employee is within the radius of any workshop
    let nearestWorkshop = null;
    let minDistance = Infinity;

    for (const w of workshops) {
      const distance = getDistanceMeters(latitude, longitude, w.lat, w.lng);
      if (distance <= w.radius && distance < minDistance) {
        minDistance = distance;
        nearestWorkshop = w;
      }
    }

    if (!nearestWorkshop) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Location is outside of all workshop geofences",
        distance: minDistance === Infinity ? null : minDistance
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. If verified, return success and the nearest workshop
    return new Response(JSON.stringify({ 
      success: true, 
      workshop: nearestWorkshop,
      distance: minDistance
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
