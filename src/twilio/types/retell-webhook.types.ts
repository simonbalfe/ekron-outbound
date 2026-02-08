export interface RetellInboundCallData {
  from_number: string;
  to_number: string;
}

export interface RetellInboundWebhookPayload {
  event: string;
  call_inbound?: RetellInboundCallData;
}

export interface RetellInboundWebhookResponseCallData {
  dynamic_variables?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface RetellInboundWebhookResponse {
  call_inbound?: RetellInboundWebhookResponseCallData;
}

export interface RetellTelephonyIdentifier {
  twilio_call_sid: string;
}

export interface RetellCallData {
  call_id: string;
  telephony_identifier: RetellTelephonyIdentifier;
  custom_sip_headers?: Record<string, string>;
}

export interface RetellTransferWebhookPayload {
  call: RetellCallData;
  name: string;
  args: {
    call_id: string;
  };
}

export type RetellDisconnectionReason =
  | 'user_hangup'
  | 'agent_hangup'
  | 'call_transfer'
  | 'voicemail_reached'
  | 'inactivity'
  | 'max_duration_reached'
  | 'concurrency_limit_reached'
  | 'dial_busy'
  | 'dial_failed'
  | 'dial_no_answer'
  | 'error_llm_websocket_open'
  | 'error_llm_websocket_lost_connection'
  | 'error_llm_websocket_runtime'
  | 'error_no_audio_received'
  | 'error_asr'
  | 'error_retell'
  | 'error_unknown';

export interface RetellCallEndedCall {
  call_id: string;
  from_number: string;
  to_number: string;
  direction: string;
  disconnection_reason: RetellDisconnectionReason;
  transfer_destination?: string;
}

export interface RetellCallEndedWebhookPayload {
  event: 'call_ended';
  call: RetellCallEndedCall;
}
