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
    
    // Support aliases for admin ('admin', 'emporia', 'emporia ventures', 'owner')
    let found = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!found && (cleanUsername === 'emporia' || cleanUsername === 'emporia ventures' || cleanUsername === 'owner')) {
      found = users.find(u => u.role === 'admin' || u.role === 'owner');
    }

    if (!found) {
      return { success: false, error: 'User not found. Please verify your operator credentials.' };
    }

    // Check PIN with fallback for default passwords
    const isValidPin = found.pin === cleanPin || 
      (found.role === 'admin' && (cleanPin === 'Eliana' || cleanPin === 'Emporia123')) ||
      (found.role === 'attendant' && cleanPin === 'Emporia00');

    if (!isValidPin) {
      return { success: false, error: 'Incorrect Password / PIN. Please try again.' };
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
   * Hidden Admin Login directly by Admin Password ("Eliana")
   */
  async loginAdmin(pin: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, error: 'Please enter the Admin security password.' };
    }

    const users = await this.getAllUsers();
    let adminUser = users.find(u => u.role === 'admin' || u.role === 'owner');

    const isMatch = cleanPin === 'Eliana' || (adminUser && adminUser.pin === cleanPin);

    if (!isMatch) {
      return { success: false, error: 'Incorrect Admin password. Access denied.' };
    }

    if (!adminUser) {
      const newAdmin: Omit<User, 'id'> = {
        username: 'admin',
        fullName: 'Emporia Ventures',
        role: 'admin',
        pin: 'Eliana',
        shopName: 'Emporia Ventures Shop',
        phone: '+256 700 889 900',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      const id = await userRepository.create(newAdmin);
      adminUser = { ...newAdmin, id };
    } else {
      // Ensure name and role are updated to Emporia Ventures / admin
      if (adminUser.fullName !== 'Emporia Ventures' || adminUser.pin !== 'Eliana') {
        adminUser.fullName = 'Emporia Ventures';
        adminUser.pin = 'Eliana';
        adminUser.role = 'admin';
        if (adminUser.id) {
          await userRepository.update(adminUser.id, {
            fullName: 'Emporia Ventures',
            pin: 'Eliana',
            role: 'admin'
          });
        }
      }
    }

    this.saveSessionUser(adminUser);
    await settingsRepository.save({ activeRole: 'admin', ownerName: 'Emporia Ventures' });

    return { success: true, user: adminUser };
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
  validateRole(user: User | null, requiredRole?: UserRole | UserRole[]): boolean {
    if (!user) return false;
    if (!requiredRole) return true;
    if (user.role === 'owner') return true; // Owner has all permissions
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  },

  /**
   * Check granular permission
   */
  hasPermission(role: UserRole, action: 'manage_settings' | 'export_backup' | 'view_reports' | 'manage_products' | 'view_stock_alerts' | 'manage_stock' | 'delete_sales' | 'manage_users' | 'record_sale' | 'record_payment'): boolean {
    if (role === 'owner' || role === 'admin') return true;

    // Attendant permissions: feed in information (sales, payments) and view sales & catalog prices
    switch (action) {
      case 'record_sale':
      case 'record_payment':
        return true;
      case 'manage_products':
      case 'view_stock_alerts':
      case 'manage_stock':
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
