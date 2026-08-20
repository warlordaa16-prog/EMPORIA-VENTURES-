import { settingsRepository } from '../repositories/settingsRepository';
import { ShopSettings } from '../types';

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    return await settingsRepository.get();
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    return await settingsRepository.save(settings);
  }
};
