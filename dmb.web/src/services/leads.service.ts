export type LeadSource = "funnel-form" | "site-chat" | "voice-agent";

export type LeadSubmission = {
  name: string;
  email: string;
  company?: string;
  need?: string;
  timeline?: string;
  budget?: string;
  message?: string;
  source: LeadSource;
  /** Always empty for real people; bots that fill it are dropped server-side. */
  website?: string;
};

export type LeadResponse = {
  message: string;
  bookingUrl?: string;
};

export async function submitLead(lead: LeadSubmission): Promise<LeadResponse> {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });

  let payload: LeadResponse | null = null;
  try {
    payload = (await response.json()) as LeadResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to send that right now.");
  }

  return payload ?? { message: "Thanks — your request is in." };
}

export type LeadRecord = {
  id?: string | number;
  created_at?: string;
  name?: string;
  email?: string;
  company?: string | null;
  need?: string | null;
  timeline?: string | null;
  budget?: string | null;
  message?: string | null;
  source?: string | null;
  status?: string | null;
};

export type LeadListResponse = {
  leads: LeadRecord[];
  storage: string;
};

export const LEAD_STATUSES = ["new", "qualified", "booked", "won", "lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export async function fetchLeads(token: string | null): Promise<LeadListResponse> {
  const response = await fetch("/api/leads", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string } | null)?.message || "Unable to load leads."
    );
  }

  return payload as LeadListResponse;
}

export async function updateLeadStatus(
  token: string | null,
  id: string | number,
  status: LeadStatus
): Promise<LeadRecord | null> {
  const response = await fetch("/api/leads", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ id, status }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string } | null)?.message || "Unable to update that lead."
    );
  }

  return (payload as { lead?: LeadRecord } | null)?.lead ?? null;
}
