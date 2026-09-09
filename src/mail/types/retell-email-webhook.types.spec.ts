import { parseRetellEmailWebhook } from './retell-email-webhook.types';

describe('parseRetellEmailWebhook', () => {
  it('maps the Retell failed-to-answer tool name to the missed-call outcome', () => {
    expect(
      parseRetellEmailWebhook({
        name: 'human_failed_to_answer_email',
        args: {},
        call: {
          retell_llm_dynamic_variables: {
            caller_number: '+441234567890',
          },
        },
      }),
    ).toEqual({
      callerNumber: '+441234567890',
      outcome: 'human_no_answer_forwarded_ai',
    });
  });

  it('maps the Retell failed-to-answer args value to the missed-call outcome', () => {
    expect(
      parseRetellEmailWebhook({
        name: 'send_email',
        args: { outcome: 'human_failed_to_answer_email' },
        call: {},
      }),
    ).toEqual({
      callerNumber: '+0000000000',
      outcome: 'human_no_answer_forwarded_ai',
    });
  });

  it('accepts an existing canonical outcome', () => {
    expect(
      parseRetellEmailWebhook({
        args: { outcome: 'connected_human' },
        call: {},
      }),
    ).toEqual({
      callerNumber: '+0000000000',
      outcome: 'connected_human',
    });
  });

  it('rejects unsupported outcomes', () => {
    expect(
      parseRetellEmailWebhook({
        args: { outcome: 'unexpected_outcome' },
      }),
    ).toBeUndefined();
  });
});
