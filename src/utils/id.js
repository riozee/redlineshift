/** Short random ID for blocks and commits. */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/** Cryptographically random workspace token. */
export const generateToken = () =>
  crypto.randomUUID() + "-" + crypto.randomUUID();
