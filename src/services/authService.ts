import { userRepository } from '../repositories/userRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import { User, UserRole, AuthSession } from '../types';
import { SEED_USERS } from '../db/seedData';

const SESSION_STORAGE_KEY = 'shoppay_active_session_user';

export interface RegisterDTO {
  username: string;
  fullName: string;
  role: UserRole;
  pin: string;
  phone?: string;
  shopName?: string;
}

export const authService = {
  /**
   * Get all registered users
   */
  async getAllUsers(): Promise<User[]> {
    let users = await userRepository.getAll();
    if (users.length === 0) {
      for (const u of SEED_USERS) {
        const existing = await userRepository.getByUsername(u.username);
        if (!existing) {
          await userRepository.create(u);
        }
      }
      users = await userRepository.getAll();
    }

    // Deduplicate in case concurrent initializations created duplicate records
    const seenUsernames = new Set<string>();
    const uniqueUsers: User[] = [];
    for (const u of users) {
      const lower = u.username.toLowerCase();
      if (!seenUsernames.has(lower)) {
        seenUsernames.add(lower);
        uniqueUsers.push(u);
      } else if (u.id) {
        // Asynchronously clean up redundant duplicate from database
        userRepository.delete(u.id).catch(() => {});
      }
    }

    return uniqueUsers;
  },

  /**
   * Login user by username/PIN
   */
  async login(username: string, pin: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    const users = await this.getAllUsers();
    const found = users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!found) {
      return { success: false, error: 'User not found. Please register or check your username.' };
    }

    if (found.pin !== cleanPin) {
      return { success: false, error: 'Incorrect PIN / Password. Please try again.' };
    }

    // Update last login
    if (found.id) {
      await userRepository.update(found.id, { lastLogin: new Date().toISOString() });
    }

    // Persist active session
    this.saveSessionUser(found);

    // Sync settings active role
    await settingsRepository.save({ activeRole: found.role });

    return { success: true, user: found };
  },

  /**
   * Register a new user (Owner or Attendant)
   */
  async register(data: RegisterDTO): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanPin = data.pin.trim();

    if (!cleanUsername || cleanUsername.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }

    if (!data.fullName.trim()) {
      return { success: false, error: 'Full name is required.' };
    }

    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: 'Security PIN must be at least 4 digits.' };
    }

    const existing = await userRepository.getByUsername(cleanUsername);
    if (existing) {
      return { success: false, error: `Username "${cleanUsername}" is already registered. Please choose another.` };
    }

    const newUser: Omit<User, 'id'> = {
      username: cleanUsername,
      fullName: data.fullName.trim(),
      role: data.role,
      pin: cleanPin,
      phone: data.phone?.trim() || '',
      shopName: data.shopName?.trim() || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const id = await userRepository.create(newUser);
    const createdUser: User = { ...newUser, id };

    // If registered as owner with custom shop name, update shop settings
    if (data.role === 'owner' && data.shopName) {
      await settingsRepository.save({
        shopName: data.shopName.trim(),
        ownerName: data.fullName.trim(),
        activeRole: 'owner'
      });
    } else if (data.role === 'attendant') {
      await settingsRepository.save({
        attendantName: data.fullName.trim()
      });
    }

    // Persist session
    this.saveSessionUser(createdUser);

    return { success: true, user: createdUser };
  },

  /**
   * Role Validation
   */
  validateRole(user: User | null, requiredRole?: UserRole): boolean {
    if (!user) return false;
    if (!requiredRole) return true;
    if (user.role === 'owner') return true; // Owner has all permissions
    return user.role === requiredRole;
  },

  /**
   * Check granular permission
   */
  hasPermission(role: UserRole, action: 'manage_settings' | 'export_backup' | 'view_reports' | 'manage_products' | 'delete_sales' | 'manage_users' | 'record_sale' | 'record_payment'): boolean {
    if (role === 'owner') return true;

    // Attendant permissions
    switch (action) {
      case 'record_sale':
      case 'record_payment':
        return true;
      case 'manage_products':
        return true; // Can view catalog
      case 'view_reports':
      case 'manage_settings':
      case 'export_backup':
      case 'delete_sales':
      case 'manage_users':
      default:
        return false;
    }
  },

  /**
   * Get active session from storage
   */
  getSessionUser(): User | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  },

  /**
   * Save session
   */
  saveSessionUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    this.saveSessionUser(null);
  },

  /**
   * Switch role/user
   */
  async switchUser(user: User): Promise<void> {
    this.saveSessionUser(user);
    await settingsRepository.save({ activeRole: user.role });
  }
};
