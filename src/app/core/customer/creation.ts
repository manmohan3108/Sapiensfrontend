export function validateCreation(name: string, focus: string) {
  const errors: { name?: string; focus?: string } = {};
  if (!name.trim()) errors.name = 'Give your Sapiens a name.';
  else if (Array.from(name.trim()).length > 255) errors.name = 'Use 255 characters or fewer for the name.';
  if (Array.from(focus.trim()).length > 255) errors.focus = 'Use 255 characters or fewer for Focus.';
  return errors;
}

// A server/network failure may occur after creation. Only explicit rejection
// statuses allow a normal retry; absence from a refreshed list proves nothing.
export function creationFailureIsDefinitive(error: unknown) {
  return [400, 401, 403, 405, 413, 422, 429].includes((error as { status?: number })?.status ?? 0);
}
