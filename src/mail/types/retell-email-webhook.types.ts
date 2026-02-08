export type CallOutcome =
  | 'connected_human'
  | 'connected_ai'
  | 'human_no_answer_forwarded_ai'
  | 'transferred_to_human';

interface SendEmailDynamicVariables {
  caller_number: string;
}

export interface SendEmailCallData {
  call_id: string;
  retell_llm_dynamic_variables: SendEmailDynamicVariables;
}

export interface SendEmailArgs {
  caller_number: string;
  outcome: CallOutcome;
}

export interface RetellEmailWebhookPayload {
  call: SendEmailCallData;
  name: string;
  args: SendEmailArgs;
}
