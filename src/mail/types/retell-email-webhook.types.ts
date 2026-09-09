const CALL_OUTCOMES = [
  'connected_human',
  'connected_ai',
  'human_no_answer_forwarded_ai',
  'transferred_to_human',
  'user_hangup',
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export interface ParsedRetellEmailWebhook {
  readonly callerNumber: string;
  readonly outcome: CallOutcome;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCallOutcome(value: unknown): CallOutcome | undefined {
  if (value === 'human_failed_to_answer_email') {
    return 'human_no_answer_forwarded_ai';
  }

  return typeof value === 'string'
    ? CALL_OUTCOMES.find((outcome) => outcome === value)
    : undefined;
}

export function parseRetellEmailWebhook(
  value: unknown,
): ParsedRetellEmailWebhook | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const args = isRecord(value.args) ? value.args : undefined;
  const outcome = normalizeCallOutcome(args?.outcome ?? value.name);
  if (!outcome) {
    return undefined;
  }

  const call = isRecord(value.call) ? value.call : undefined;
  const dynamicVariables = isRecord(call?.retell_llm_dynamic_variables)
    ? call.retell_llm_dynamic_variables
    : undefined;
  const callerNumber =
    typeof dynamicVariables?.caller_number === 'string'
      ? dynamicVariables.caller_number
      : '+0000000000';

  return { callerNumber, outcome };
}
