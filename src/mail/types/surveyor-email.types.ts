export interface SurveyorEmailArgs {
  subject: string;
  notes: string;
  phone: string;
}

export interface SurveyorEmailWebhookPayload {
  args: SurveyorEmailArgs;
}
