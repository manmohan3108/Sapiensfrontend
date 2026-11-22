export type UserRole = 'customer' | 'admin';

export interface AccountProfile {
  first_name: string;
  last_name: string;
  preferred_name: string;
  occupation: string;
  organisation: string;
  timezone: string;
  about: string;
}

export interface AuthUser {
  profile?: AccountProfile;
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  customer_tier: string;
  analysis_simulation_access?: boolean;
}

export interface TokenPair {
  access: string;
  refresh: string;
  token_type: 'Bearer';
  access_expires_in: number;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegistrationCredentials extends AuthCredentials {
  email?: string;
  profile?: Partial<AccountProfile>;
}

export type RegistrationResult = AuthUser & { profileSaveError?: string };
