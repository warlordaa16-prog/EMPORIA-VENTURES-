import { db } from '../db/database';
import { ShopSettings } from '../types';
import { DEFAULT_SETTINGS } from '../db/seedData';

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    const list = await db.settings.toArray();
    if (list.length > 0) {
      return list[0];
    }
    const id = await db.settings.add({ ...DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS, id: id as number };
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const current = await this.getSettings();
    const updated: ShopSettings = {
      ...current,
      ...settings
    };
    if (current.id) {
      await db.settings.update(current.id, updated);
    } else {
      await db.settings.put(updated);
    }
    return updated;
  }
};
