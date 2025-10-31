export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}

export const loginEmail = requireEnvVar('E2E_LOGIN_EMAIL');
export const loginPassword = requireEnvVar('E2E_LOGIN_PASSWORD');
