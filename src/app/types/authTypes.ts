export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  customer_tier: string;
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
}
