import { UserRole } from '@campus-os/shared-types';

export type RootRouteName = 'FoundationHome' | 'StudentPortal' | 'RecruiterPortal' | 'AdminPortal';

export interface NavigationState {
  currentRoute: RootRouteName;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
}
