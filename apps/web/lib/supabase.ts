import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.STORAGE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  "https://affjbuibhbejzzrwdusw.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.STORAGE_ANON_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  "sb_publishable_R_NWOXD6RXYOn3gGAsquNQ_Q5_OLjRO";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Upload a clinical report file directly to Supabase Storage bucket
 */
export async function uploadReportToSupabase(
  file: File,
  userId: string | number
): Promise<{ path: string; url: string | null; error: Error | null }> {
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `reports/${userId}/${timestamp}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { path: "", url: null, error };
    }

    const { data: publicUrlData } = supabase.storage
      .from("medical-reports")
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrlData?.publicUrl || null,
      error: null,
    };
  } catch (err: any) {
    return { path: "", url: null, error: err };
  }
}
