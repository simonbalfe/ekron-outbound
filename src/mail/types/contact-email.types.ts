export interface ContactEmailArgs {
  subject: string;
  phone: string;
  property: string;
  service: string;
  name: string;
  notes: string;
}

export interface ContactEmailWebhookPayload {
  args: ContactEmailArgs;
}
