// Online high scores (Supabase). Leave url/anonKey empty to keep scores only in each player's browser.
// The publishable/anon key is meant to be public. NEVER put the service_role or secret key here.
export default {
  // Saves go through the deployed server endpoint; direct database inserts are disabled.
  submissionUrl: 'https://nqymnjgebhpjjgfoygbt.supabase.co/functions/v1/submit-score',
  url: 'https://nqymnjgebhpjjgfoygbt.supabase.co',
  anonKey: 'sb_publishable_engJ56lGty0-vN8HKLrEVw_aDhAiTRK',
  // shown under the board so players know how to get a name removed (email, GitHub issues link, ...)
  contact: 'https://github.com/pnaaberi/coffin-dance/issues',
};
