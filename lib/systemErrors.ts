import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SystemError = {
  id: string;
  error_message: string;
  component_path: string;
  occurrences_count: number;
  first_occurred_at: string;
  last_occurred_at: string;
  stack_trace: string | null;
};

export async function loadSystemErrors(db: SupabaseClient): Promise<SystemError[]> {
  const { data, error } = await db
    .from("system_errors")
    .select("id, error_message, component_path, occurrences_count, first_occurred_at, last_occurred_at, stack_trace")
    .order("last_occurred_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("system_errors query failed");
  return (data ?? []) as SystemError[];
}
