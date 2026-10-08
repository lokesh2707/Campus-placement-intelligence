import { UserRole } from '@campus-os/shared-types';

export type UnauthRouteName = 'Login' | 'Register' | 'ForgotPassword';
export type AuthRouteName = 'StudentHome' | 'RecruiterHome' | 'AdminHome';
export type RootRouteName = UnauthRouteName | AuthRouteName | 'FoundationHome';

export interface NavigationState {
  currentRoute: RootRouteName;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
}
