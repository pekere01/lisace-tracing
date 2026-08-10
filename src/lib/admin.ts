import { createClient } from "@/lib/supabase/client";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: "admin" | "personel";
  createdAt: string | null;
};

type AdminActionPayload = Record<string, unknown> & { action: string };

/** admin-operations Edge Function'ı çağırır — service_role işlemleri yalnızca orada. */
async function callAdminOperation<T = unknown>(payload: AdminActionPayload): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("admin-operations", {
    body: payload,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function listUsers() {
  return callAdminOperation<{ ok: true; users: AdminUser[] }>({ action: "list_users" });
}

export function createUser(input: {
  email: string;
  password: string;
  username: string;
  role: "admin" | "personel";
}) {
  return callAdminOperation<{ ok: true; userId: string }>({
    action: "create_user",
    ...input,
  });
}

export function deleteUser(userId: string) {
  return callAdminOperation<{ ok: true }>({ action: "delete_user", userId });
}

export function resetPassword(userId: string, password: string) {
  return callAdminOperation<{ ok: true }>({ action: "reset_password", userId, password });
}
