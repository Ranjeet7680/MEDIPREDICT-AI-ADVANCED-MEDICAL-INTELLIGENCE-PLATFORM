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
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey || "sb_placeholder_anon_key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Upload a clinical report file directly to private Supabase Storage bucket.
 * Generates a private path and short-lived signed URL for authorized access.
 * NEVER creates public URLs for medical reports.
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

    // Enterprise Healthcare Security: Generate short-lived signed URL (300 seconds)
    // Never expose private medical records via public bucket URLs
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(data.path, 300);

    return {
      path: data.path,
      url: signedUrlData?.signedUrl || null,
      error: signError || null,
    };
  } catch (err: any) {
    return { path: "", url: null, error: err };
  }
}
