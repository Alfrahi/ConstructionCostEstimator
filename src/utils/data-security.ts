const MASKED_VALUE = "[REDACTED]";

const SENSITIVE_FIELDS_MAP: Record<string, string[]> = {
  profiles: [
    "email",
    "first_name",
    "last_name",
    "company_name",
    "company_website",
  ],
  comments: ["content"],
  project_shares: ["shared_with_email"],
  audit_logs: ["user_email", "old_data", "new_data"],
};

export function maskSensitiveData(
  tableName: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const maskedPayload: Record<string, unknown> = { ...payload };
  const sensitiveFields = SENSITIVE_FIELDS_MAP[tableName];

  if (sensitiveFields) {
    for (const field of sensitiveFields) {
      if (Object.prototype.hasOwnProperty.call(maskedPayload, field)) {
        maskedPayload[field] = MASKED_VALUE;
      }
    }
  }
  return maskedPayload;
}
