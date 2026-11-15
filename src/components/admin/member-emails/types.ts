/** A member as listed in the dashboard (GET /api/admin/members). */
export type EmailableMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  registrationCompletedAt: string | null;
  boardInterest?: boolean | null;
  city?: string | null;
  province?: string | null;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type EmailProgress = { total: number; sent: number; failed: number; pending: number };

export type MemberEmailSummary = EmailProgress & {
  id: string;
  subject: string;
  sentBy: string;
  createdAt: string;
};
