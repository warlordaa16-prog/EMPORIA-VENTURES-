import { db } from '../db/database';
import { BackupData } from '../types';
import { DEFAULT_SETTINGS } from '../db/seedData';

export const backupRepository = {
  async dumpAllData(): Promise<BackupData> {
    const [settingsList, users, customers, products, sales, saleItems, payments] = await Promise.all([
      db.settings.toArray(),
      db.users.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.sales.toArray(),
      db.sale_items.toArray(),
      db.payments.toArray()
    ]);

    const settings = settingsList[0] || DEFAULT_SETTINGS;

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      shopName: settings.shopName,
      settings,
      users,
      customers,
      products,
      sales,
      saleItems,
      payments
    };
  },

  async restoreAllData(data: BackupData): Promise<void> {
    const tables = [db.users, db.customers, db.products, db.sales, db.sale_items, db.payments, db.settings];
    await db.transaction('rw', tables, async () => {
      // Clear existing records
      await db.users.clear();
      await db.customers.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
      await db.settings.clear();

      // Bulk restore
      if (data.users && data.users.length > 0) {
        await db.users.bulkAdd(data.users);
      }
      if (data.settings) {
        await db.settings.add(data.settings);
      }
      if (data.customers && data.customers.length > 0) {
        await db.customers.bulkAdd(data.customers);
      }
      if (data.products && data.products.length > 0) {
        await db.products.bulkAdd(data.products);
      }
      if (data.sales && data.sales.length > 0) {
        await db.sales.bulkAdd(data.sales);
      }
      if (data.saleItems && data.saleItems.length > 0) {
        await db.sale_items.bulkAdd(data.saleItems);
      }
      if (data.payments && data.payments.length > 0) {
        await db.payments.bulkAdd(data.payments);
      }
    });
  },

  async wipeDatabase(): Promise<void> {
    const tables = [db.users, db.customers, db.products, db.sales, db.sale_items, db.payments, db.settings];
    await db.transaction('rw', tables, async () => {
      await db.users.clear();
      await db.customers.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
      await db.settings.clear();
    });
  }
};
