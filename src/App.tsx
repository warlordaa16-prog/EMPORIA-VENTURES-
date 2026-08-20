/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Product, Sale, ShopSettings, User } from './types';
import { initializeDatabase } from './db/database';
import { DEFAULT_SETTINGS } from './db/seedData';
import { settingsService } from './services/settingsService';
import { authService } from './services/authService';
import { AppLayout } from './layouts/AppLayout';

// Auth & Architecture
import { LoginPortal } from './components/auth/LoginPortal';
import { RoleGuard } from './components/auth/RoleGuard';
import { ArchitectureModal } from './components/architecture/ArchitectureModal';

// Modals
import { NewSaleModal } from './components/sales/NewSaleModal';
import { SaleDetailsModal } from './components/sales/SaleDetailsModal';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';
import { CustomerModal } from './components/customers/CustomerModal';
import { CustomerDetailsDrawer } from './components/customers/CustomerDetailsDrawer';
import { ProductModal } from './components/products/ProductModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Customers } from './pages/Customers';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [salePreselectedCustomerId, setSalePreselectedCustomerId] = useState<number | undefined>(undefined);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentTargetCustomer, setPaymentTargetCustomer] = useState<Customer | undefined>(undefined);
  const [paymentTargetSale, setPaymentTargetSale] = useState<Sale | undefined>(undefined);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [drawerCustomerId, setDrawerCustomerId] = useState<number | null>(null);

  // Initialize DB and load session on mount
  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        const loadedSettings = await settingsService.getSettings();
        setSettings(loadedSettings);

        // Check if there is an active session
        const sessionUser = authService.getSessionUser();
        if (sessionUser) {
          setCurrentUser(sessionUser);
        }

        setIsDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setIsDbReady(true);
      }
    }
    setup();
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    triggerRefresh();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleOpenNewSale = (customerId?: number) => {
    setSalePreselectedCustomerId(customerId);
    setIsNewSaleOpen(true);
  };

  const handleOpenRecordPayment = (customer?: Customer, sale?: Sale) => {
    setPaymentTargetCustomer(customer);
    setPaymentTargetSale(sale);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenCustomerModal = (customer?: Customer | null) => {
    setCustomerToEdit(customer || null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenProductModal = (product?: Product | null) => {
    setProductToEdit(product || null);
    setIsProductModalOpen(true);
  };

  const handleViewSale = (sale: Sale) => {
    setViewingSale(sale);
  };

  const handleSelectCustomer = (customerId: number) => {
    setDrawerCustomerId(customerId);
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] text-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#173B6C] to-[#2F6DB2] text-white flex items-center justify-center font-black text-xl animate-pulse">
          SP
        </div>
        <p className="text-xs font-semibold text-slate-500">Initializing ShopPay Offline Architecture...</p>
      </div>
    );
  }

  // If not authenticated, display the Login & Registration Portal
  if (!currentUser) {
    return (
      <>
        <LoginPortal
          onAuthenticated={handleAuthenticated}
          settings={settings}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
        />
        <ArchitectureModal
          isOpen={isArchitectureOpen}
          onClose={() => setIsArchitectureOpen(false)}
          currentUser={currentUser}
          settings={settings}
        />
      </>
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      settings={settings}
      currentUser={currentUser}
      onOpenNewSale={() => handleOpenNewSale()}
      onOpenRecordPayment={() => handleOpenRecordPayment()}
      onLogout={handleLogout}
      onOpenArchitecture={() => setIsArchitectureOpen(true)}
    >
      {/* Tab Switcher */}
      {activeTab === 'dashboard' && (
        <Dashboard
          settings={settings}
          currentUser={currentUser}
          onOpenNewSale={() => handleOpenNewSale()}
          onOpenRecordPayment={() => handleOpenRecordPayment()}
          onOpenNewCustomer={() => handleOpenCustomerModal()}
          onViewSale={handleViewSale}
          onViewCustomer={handleSelectCustomer}
          onNavigate={setActiveTab}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'sales' && (
        <Sales
          settings={settings}
          onOpenNewSale={() => handleOpenNewSale()}
          onViewSale={handleViewSale}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'customers' && (
        <Customers
          settings={settings}
          onOpenNewCustomer={() => handleOpenCustomerModal()}
          onSelectCustomer={handleSelectCustomer}
          onRecordPaymentForCustomer={cust => handleOpenRecordPayment(cust)}
          onCreateSaleForCustomer={custId => handleOpenNewSale(custId)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'payments' && (
        <Payments
          settings={settings}
          onOpenRecordPayment={() => handleOpenRecordPayment()}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'reports' && (
        <RoleGuard
          currentUser={currentUser}
          requiredRole={['owner', 'admin']}
          title="Management Financial Reports"
          description="Access to sales summaries, profit breakdowns, and debtor ledgers is restricted to Store Managers and Owners."
          onElevateToAdmin={elevatedUser => setCurrentUser(elevatedUser)}
        >
          <Reports
            settings={settings}
            refreshTrigger={refreshTrigger}
          />
        </RoleGuard>
      )}

      {activeTab === 'products' && (
        <Products
          settings={settings}
          currentUser={currentUser}
          onOpenProductModal={handleOpenProductModal}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'settings' && (
        <RoleGuard
          currentUser={currentUser}
          requiredRole={['owner', 'admin']}
          title="Shop Settings & Device Backup"
          description="Access to business configuration, currency settings, and database backups requires Admin/Owner credentials."
          onElevateToAdmin={elevatedUser => setCurrentUser(elevatedUser)}
        >
          <Settings
            settings={settings}
            onSettingsUpdated={updated => {
              setSettings(updated);
              triggerRefresh();
            }}
            refreshTrigger={refreshTrigger}
          />
        </RoleGuard>
      )}

      {/* Architecture Inspector Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
        currentUser={currentUser}
        settings={settings}
      />

      {/* Global Modals */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => {
          setIsNewSaleOpen(false);
          setSalePreselectedCustomerId(undefined);
        }}
        onSaleCreated={sale => {
          triggerRefresh();
          setViewingSale(sale);
        }}
        currency={settings.currency}
        preselectedCustomerId={salePreselectedCustomerId}
      />

      <SaleDetailsModal
        sale={viewingSale}
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        settings={settings}
        onSaleUpdated={triggerRefresh}
        onRecordPaymentClick={sale => handleOpenRecordPayment(undefined, sale)}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setPaymentTargetCustomer(undefined);
          setPaymentTargetSale(undefined);
        }}
        onPaymentRecorded={() => triggerRefresh()}
        currency={settings.currency}
        targetCustomer={paymentTargetCustomer}
        targetSale={paymentTargetSale}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onSaved={() => triggerRefresh()}
      />

      <CustomerDetailsDrawer
        customerId={drawerCustomerId}
        isOpen={!!drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        settings={settings}
        onEditCustomer={cust => handleOpenCustomerModal(cust)}
        onRecordPayment={cust => handleOpenRecordPayment(cust)}
        onCreateSaleForCustomer={custId => handleOpenNewSale(custId)}
        onViewSale={handleViewSale}
        onRefresh={triggerRefresh}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaved={() => triggerRefresh()}
        onDeleted={() => triggerRefresh()}
        currency={settings.currency}
      />
    </AppLayout>
  );
}
