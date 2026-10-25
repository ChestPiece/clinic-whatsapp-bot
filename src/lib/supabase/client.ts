import { createBrowserClient } from "@supabase/ssr";

// Browser client (Realtime, sign-in). Signed-in user, RLS applies.
export const supabaseBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
