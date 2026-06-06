import Cookies from 'js-cookie';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'EMPLOYEE' | 'EMPLOYER' | 'ADMIN';
  currency: string;
  departmentId?: string;
}

export function saveToken(token: string): void {
  Cookies.set('token', token, { expires: 7, sameSite: 'lax' });
}

export function getToken(): string | undefined {
  return Cookies.get('token');
}

export function removeToken(): void {
  Cookies.remove('token');
}

export function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as AuthUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  return decodeUser(token);
}

export function isEmployee(user: AuthUser | null): boolean {
  return user?.role === 'EMPLOYEE';
}

export function isEmployer(user: AuthUser | null): boolean {
  return user?.role === 'EMPLOYER' || user?.role === 'ADMIN';
}
