'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Employee, EmployeeRole, Outlet, CustomerAccount } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletSelector } from '@/components/admin/OutletSelector';
import {
  ROLE_DEFINITIONS,
  PERMISSION_CATEGORIES,
  getRoleDefinition,
  getAllRoleDefinitions,
  hasPermission,
} from '@/lib/auth/rbac';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Store,
  ChefHat,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Trash2,
  X,
  Shield,
  Layers,
  Lock,
  Check,
  Info,
  SlidersHorizontal,
  Truck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Edit3,
  KeyRound,
  Copy,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const { user } = useAuth();
  const adminUser = user && user.role === 'ADMIN' ? user : null;
  const isOutletManager = Boolean(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all')
  );

  const [activeTab, setActiveTab] = useState<'roster' | 'customers' | 'rbac'>('roster');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all')
      ? adminUser.outletAccess[0]
      : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // RBAC Matrix Filter
  const [highlightedRole, setHighlightedRole] = useState<EmployeeRole | 'ALL'>('ALL');

  // Password & Credentials Manager State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [credentialTarget, setCredentialTarget] = useState<{
    type: 'STAFF' | 'CUSTOMER';
    id: string;
    name: string;
    identifier: string; // Email for staff, Phone for customer
    phone: string;
    role: string;
    currentPassword?: string;
  } | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [savedCredentialShare, setSavedCredentialShare] = useState<{
    portalUrl: string;
    username: string;
    phone: string;
    password: string;
    name: string;
    role?: string;
    shareText: string;
    whatsappUrl?: string;
  } | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  // New Employee Form State (Not pre-filled)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<EmployeeRole | ''>('');
  const [newOutlet, setNewOutlet] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Add Customer Form State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPassword, setNewCustPassword] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustArea, setNewCustArea] = useState('College Road');
  const [newCustPincode, setNewCustPincode] = useState('422005');

  // Edit Employee Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<EmployeeRole>('KITCHEN_STAFF');
  const [editOutlet, setEditOutlet] = useState('cycle-circle');
  const [editDesignation, setEditDesignation] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Password Generator Helper
  const generatePassword = (type: 'memorable' | 'strong' | 'pin') => {
    if (type === 'pin') {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setNewPasswordValue(pin);
    } else if (type === 'memorable') {
      const prefixes = ['PnR', 'Puffs', 'Bakery', 'Nashik', 'Oven'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const num = Math.floor(1000 + Math.random() * 9000);
      setNewPasswordValue(`${prefix}@${num}`);
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
      let res = '';
      for (let i = 0; i < 10; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setNewPasswordValue(res);
    }
  };

  const handleOpenStaffPasswordModal = (emp: Employee) => {
    setCredentialTarget({
      type: 'STAFF',
      id: emp.id,
      name: emp.name,
      identifier: emp.email,
      phone: emp.phone || '',
      role: emp.role,
      currentPassword: emp.password,
    });
    setNewPasswordValue(emp.password || '');
    setSavedCredentialShare(null);
    setIsPasswordModalOpen(true);
  };

  const handleOpenCustomerPasswordModal = (cust: CustomerAccount) => {
    setCredentialTarget({
      type: 'CUSTOMER',
      id: cust.id,
      name: cust.name,
      identifier: cust.phone,
      phone: cust.phone,
      role: 'CUSTOMER',
      currentPassword: cust.password,
    });
    setNewPasswordValue(cust.password || 'pnr@customer123');
    setSavedCredentialShare(null);
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async () => {
    if (!credentialTarget || !newPasswordValue.trim()) return;
    setIsSavingPassword(true);
    try {
      if (credentialTarget.type === 'STAFF') {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESET_PASSWORD',
            employeeId: credentialTarget.id,
            newPassword: newPasswordValue.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.loginInfo) {
          setSavedCredentialShare(data.loginInfo);
          setStatusMessage(`✓ Password updated for ${credentialTarget.name}`);
          setEmployees((prev) =>
            prev.map((e) => (e.id === credentialTarget.id ? { ...e, password: newPasswordValue.trim() } : e))
          );
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          alert(data.error || 'Failed to update employee password');
        }
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESET_PASSWORD',
            phone: credentialTarget.phone,
            newPassword: newPasswordValue.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.loginInfo) {
          setSavedCredentialShare(data.loginInfo);
          setStatusMessage(`✓ Password updated for ${credentialTarget.name}`);
          setCustomers((prev) =>
            prev.map((c) => (c.phone === credentialTarget.phone ? { ...c, password: newPasswordValue.trim() } : c))
          );
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          alert(data.error || 'Failed to update customer password');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error updating password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleOpenAddModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole(isOutletManager ? 'KITCHEN_STAFF' : '');
    setNewOutlet(isOutletManager && adminUser?.outletAccess?.[0] ? adminUser.outletAccess[0] : '');
    setNewDesignation('');
    setNewPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);
    setEditOutlet(emp.outletSlug);
    setEditDesignation(emp.designation);
    setEditStatus(emp.status);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (isOutletManager && adminUser?.outletAccess?.[0]) {
      setSelectedOutlet(adminUser.outletAccess[0]);
      setNewOutlet(adminUser.outletAccess[0]);
      setNewRole('KITCHEN_STAFF');
    }
  }, [isOutletManager, adminUser]);

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success && data.outlets) {
        setOutlets(data.outlets);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees?outlet=${selectedOutlet}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearchQuery)}`);
      const data = await res.json();
      if (data.success && data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [selectedOutlet]);

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab, customerSearchQuery]);

  const handleDeleteCustomer = async (phone: string, name: string) => {
    if (!confirm(`Are you sure you want to remove customer account for ${name} (${phone})?`)) {
      return;
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', phone }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.phone !== phone));
        setStatusMessage(`✓ Customer ${name} removed`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Delete customer error', err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const assignedPass = newCustPassword.trim() || 'pnr@customer123';
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          email: newCustEmail.trim() || undefined,
          password: assignedPass,
          address: newCustAddress.trim() || 'College Road, Nashik',
          area: newCustArea.trim() || 'College Road',
          pincode: newCustPincode.trim() || '422005',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCustomerModalOpen(false);
        fetchCustomers();
        if (data.loginInfo) {
          setCredentialTarget({
            type: 'CUSTOMER',
            id: data.customer?.id || 'new',
            name: newCustName.trim(),
            identifier: newCustPhone.trim(),
            phone: newCustPhone.trim(),
            role: 'CUSTOMER',
            currentPassword: assignedPass,
          });
          setSavedCredentialShare(data.loginInfo);
          setNewPasswordValue(assignedPass);
          setIsPasswordModalOpen(true);
        }
        setNewCustName('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustPassword('');
        setNewCustAddress('');
        setStatusMessage(`✓ Customer ${newCustName} created successfully`);
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Create customer error', err);
    }
  };

  const handleToggleStatus = async (employeeId: string) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          employeeId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === employeeId ? data.employee : e))
        );
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  const handleDeleteEmployee = async (employeeId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from system access?`)) {
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          employeeId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        setStatusMessage(`Employee ${name} removed`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Delete employee error', err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          employeeData: {
            name: newName,
            email: newEmail,
            phone: newPhone,
            role: newRole,
            outletSlug:
              newRole === 'SUPER_ADMIN' || newRole === 'MARKETING_MANAGER'
                ? 'all'
                : newOutlet,
            designation:
              newDesignation ||
              (newRole === 'SUPER_ADMIN'
                ? 'HQ Operations Administrator'
                : newRole === 'OUTLET_MANAGER'
                ? 'Outlet Store Manager'
                : newRole === 'MARKETING_MANAGER'
                ? 'Lead Performance Marketer'
                : 'Kitchen Specialist'),
            password: newPassword.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ ${newName} added to staff directory`);
        setIsModalOpen(false);
        fetchEmployees();
        if (data.loginInfo) {
          setCredentialTarget({
            type: 'STAFF',
            id: data.employee.id,
            name: data.employee.name,
            identifier: data.employee.email,
            phone: data.employee.phone || '',
            role: data.employee.role,
            currentPassword: data.loginInfo.password,
          });
          setSavedCredentialShare(data.loginInfo);
          setNewPasswordValue(data.loginInfo.password);
          setIsPasswordModalOpen(true);
        }
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewDesignation('');
        setNewPassword('');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Create employee error', err);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editName || !editEmail) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          employeeId: editingEmployee.id,
          updates: {
            name: editName,
            email: editEmail,
            phone: editPhone,
            role: editRole,
            outletSlug:
              editRole === 'SUPER_ADMIN' || editRole === 'MARKETING_MANAGER'
                ? 'all'
                : editOutlet,
            designation: editDesignation,
            status: editStatus,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ User ${editName} updated successfully`);
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        fetchEmployees();
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to update employee');
      }
    } catch (err) {
      console.error('Update employee error', err);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery);
    const matchesOutlet =
      selectedOutlet === 'all' ||
      emp.outletSlug === selectedOutlet ||
      emp.outletSlug === 'all';
    return matchesSearch && matchesOutlet;
  });

  const getRoleIcon = (role: EmployeeRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'OUTLET_MANAGER':
        return <Store className="w-3.5 h-3.5" />;
      case 'KITCHEN_STAFF':
        return <ChefHat className="w-3.5 h-3.5" />;
      case 'MARKETING_MANAGER':
        return <SlidersHorizontal className="w-3.5 h-3.5" />;
    }
  };

  const getRoleBadge = (role: EmployeeRole) => {
    const def = getRoleDefinition(role);
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border flex items-center gap-1 ${def.badge.bg} ${def.badge.text} ${def.badge.border}`}
      >
        {getRoleIcon(role)}
        <span>{def.shortName}</span>
      </span>
    );
  };

  const allRoles = getAllRoleDefinitions();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Users, Staff &amp; Credentials Operations
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Administer staff roles, registered customer accounts, instant password resets, and login credential distribution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Navigation */}
          <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Roster ({employees.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'customers'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />
              <span>Customer Accounts ({customers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rbac'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-stone-700" />
              <span>RBAC Matrix</span>
            </button>
          </div>

          {activeTab === 'roster' && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}

          {activeTab === 'customers' && (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: STAFF ROSTER VIEW
         ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
              />
            </div>

            {/* Outlet Filter Selector or locked kitchen badge */}
            {isOutletManager ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-xs font-semibold text-amber-900 shadow-2xs shrink-0">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {outlets
                    .find((o) => o.slug === selectedOutlet)
                    ?.name.replace("Puffs 'n' Rolls - ", '') || 'Your Kitchen Staff'}
                </span>
              </div>
            ) : (
              <OutletSelector
                outlets={outlets}
                selectedOutlet={selectedOutlet}
                onSelectOutlet={(slug) => setSelectedOutlet(slug)}
                includeAll={true}
                allLabel="All Staff (HQ)"
                label="Outlet Team:"
                size="sm"
              />
            )}
          </div>

          {/* Staff Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEmployees.map((emp) => {
              const isActive = emp.status === 'ACTIVE';

              return (
                <div
                  key={emp.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                    isActive
                      ? 'bg-white border-stone-200/90 hover:border-stone-400'
                      : 'bg-stone-50/60 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-sm text-stone-900 font-serif">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-serif font-bold text-stone-900 leading-tight">
                            {emp.name}
                          </h3>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            {emp.designation}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-100 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-mono text-[11px]">{emp.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {getRoleBadge(emp.role)}
                      <span className="text-[11px] font-mono text-stone-500">
                        {emp.outletSlug === 'all'
                          ? 'HQ (All Outlets)'
                          : outlets
                              .find((o) => o.slug === emp.outletSlug)
                              ?.name.replace("Puffs 'n' Rolls - ", '') || emp.outletSlug}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {emp.lastLogin
                        ? `Active ${new Date(emp.lastLogin).toLocaleDateString()}`
                        : 'Invited'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenStaffPasswordModal(emp)}
                        className="px-2 py-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                        title="Change Password & Login Credentials"
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Password</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="px-2 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                        title="Edit User Details & Access"
                      >
                        <Edit3 className="w-3 h-3 text-stone-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: REGISTERED CUSTOMERS & CREDENTIALS
         ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered customers by name, mobile number (+91 98220...), or email..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCustomers}
                className="p-2.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
                title="Refresh customer accounts from database"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Customer Directory Grid */}
          {isLoadingCustomers ? (
            <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-3xl border border-stone-200/90">
              Loading customer accounts from PostgreSQL...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/90 space-y-2">
              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-serif font-bold text-stone-700">No customer accounts found</p>
              <p className="text-xs text-stone-400">
                Customer accounts will appear as visitors place orders or sign up online.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {customers.map((cust) => {
                const primaryAddress = cust.savedAddresses?.[0];

                return (
                  <div
                    key={cust.id || cust.phone}
                    className="p-5 rounded-3xl border border-stone-200/90 bg-white hover:border-stone-400 transition-all duration-200 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center font-bold text-sm text-amber-900 font-serif">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-serif font-bold text-stone-900 leading-tight">
                              {cust.name}
                            </h3>
                            <span className="text-[11px] font-mono text-emerald-700 font-semibold block mt-0.5">
                              +91 {cust.phone}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-100 space-y-2 text-xs text-stone-600">
                        {cust.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </div>
                        )}
                        {primaryAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                              {primaryAddress.address}, {primaryAddress.area}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 text-[11px]">
                          <span className="text-stone-400">Total Spent:</span>
                          <span className="font-bold text-stone-900 font-mono">
                            ₹{cust.totalSpent.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                      <span className="font-mono">
                        Member since {new Date(cust.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenCustomerPasswordModal(cust)}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-[11px]"
                          title="Reset Password & Share Login Credentials"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(cust.phone, cust.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                          title="Remove Customer Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: ENTERPRISE RBAC MATRIX VIEW
         ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Role Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {allRoles.map((role) => {
              const staffCount = employees.filter((e) => e.role === role.id).length;
              const isSelected = highlightedRole === role.id;

              return (
                <div
                  key={role.id}
                  onClick={() =>
                    setHighlightedRole(highlightedRole === role.id ? 'ALL' : role.id)
                  }
                  className={`p-4 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900 ring-offset-2'
                      : 'bg-white text-stone-900 border-stone-200/90 hover:border-stone-400'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`p-1.5 rounded-xl border text-xs ${
                          isSelected
                            ? 'bg-stone-800 text-white border-stone-700'
                            : `${role.badge.bg} ${role.badge.text} ${role.badge.border}`
                        }`}
                      >
                        {getRoleIcon(role.id)}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider ${
                          role.scope === 'ALL_OUTLETS'
                            ? isSelected
                              ? 'bg-stone-800 text-stone-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : isSelected
                            ? 'bg-stone-800 text-stone-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {role.scope === 'ALL_OUTLETS' ? 'HQ Global' : 'Store Local'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-sm">{role.shortName}</h4>
                      <p
                        className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {role.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-3 pt-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
                      isSelected
                        ? 'border-stone-800 text-stone-300'
                        : 'border-stone-100 text-stone-600'
                    }`}
                  >
                    <span>Personnel</span>
                    <span className="font-semibold">{staffCount} Active</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions Matrix Interactive Table */}
          <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-stone-200/80 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Granular Security &amp; Permissions Matrix</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Discrete system permissions mapped across role scopes and functional boundaries
                </p>
              </div>

              {highlightedRole !== 'ALL' && (
                <button
                  onClick={() => setHighlightedRole('ALL')}
                  className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-medium transition cursor-pointer"
                >
                  Clear Column Filter
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#FAF8F5] text-stone-600 font-mono text-[11px]">
                    <th className="py-3 px-5 font-semibold text-stone-800 w-1/3">
                      Functional Domain &amp; Capability
                    </th>
                    {allRoles.map((role) => (
                      <th
                        key={role.id}
                        className={`py-3 px-3 text-center transition ${
                          highlightedRole === role.id ? 'bg-stone-100 font-bold' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{role.shortName}</span>
                          <span className="text-[9px] text-stone-400 font-normal">
                            {role.scope === 'ALL_OUTLETS' ? 'All Outlets' : 'Store'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {PERMISSION_CATEGORIES.map((category) => (
                    <React.Fragment key={category.id}>
                      {/* Domain Header Row */}
                      <tr className="bg-stone-50/80 border-t border-b border-stone-200/60">
                        <td
                          colSpan={allRoles.length + 1}
                          className="py-2.5 px-5 font-serif font-bold text-xs text-stone-900 tracking-wide"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-600" />
                            <span>{category.title}</span>
                            <span className="text-[10px] text-stone-500 font-sans font-normal ml-2">
                              — {category.description}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Permission Rows */}
                      {category.permissions.map((perm) => (
                        <tr
                          key={perm.id}
                          className="hover:bg-[#FAF8F5]/80 transition group"
                        >
                          <td className="py-3 px-5 space-y-0.5">
                            <span className="font-semibold text-stone-800 block text-xs">
                              {perm.label}
                            </span>
                            <span className="text-[10px] text-stone-500 leading-snug block">
                              {perm.description}
                            </span>
                          </td>

                          {allRoles.map((role) => {
                            const allowed = hasPermission(role.id, perm.id);

                            return (
                              <td
                                key={role.id}
                                className={`py-3 px-3 text-center transition ${
                                  highlightedRole === role.id ? 'bg-stone-50' : ''
                                }`}
                              >
                                {allowed ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 text-stone-300 font-mono text-sm">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security & Enforcement Summary */}
          <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
              <Shield className="w-4 h-4 text-stone-700" />
              <span>Clean Architecture RBAC &amp; Store Boundary Enforcement</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every sensitive action (order kitchen progression, 1-tap sold-out 86, Mangwale API credentials,
              Meta/Google ad tracking pixels, and staff creation) is evaluated against declarative permission
              tokens in <code className="px-1.5 py-0.5 bg-white rounded border text-stone-800 font-mono">src/lib/auth/rbac.ts</code>.
              Store managers are strictly limited to their own outlet&apos;s orders, stock, and Mangwale logistics keys.
            </p>
          </div>
        </div>
      )}

      {/* Add Employee Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-stone-700" />
                <span>Add Staff Member</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@puffsnrolls.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Access Role *
                  </label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium">
                      Kitchen Staff
                    </div>
                  ) : (
                    <select
                      value={newRole}
                      required
                      onChange={(e) => setNewRole(e.target.value as EmployeeRole)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 cursor-pointer"
                    >
                      <option value="">Select Role...</option>
                      <option value="OUTLET_MANAGER">Store Manager</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                      <option value="MARKETING_MANAGER">Marketing Manager</option>
                      <option value="SUPER_ADMIN">HQ Super Admin</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Assigned Store Scope
                  </label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium truncate">
                      {outlets
                        .find((o) => o.slug === newOutlet)
                        ?.name.replace("Puffs 'n' Rolls - ", '') || newOutlet}
                    </div>
                  ) : (
                    <select
                      value={
                        newRole === 'SUPER_ADMIN' || newRole === 'MARKETING_MANAGER'
                          ? 'all'
                          : newOutlet
                      }
                      disabled={
                        newRole === 'SUPER_ADMIN' || newRole === 'MARKETING_MANAGER'
                      }
                      onChange={(e) => setNewOutlet(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select Store Scope...</option>
                      {(newRole === 'SUPER_ADMIN' ||
                        newRole === 'MARKETING_MANAGER') && (
                        <option value="all">All Outlets (HQ Global)</option>
                      )}
                      {outlets.map((o) => (
                        <option key={o.slug} value={o.slug}>
                          {o.name.replace("Puffs 'n' Rolls - ", '')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Designation Title
                </label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Shift Manager"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-700 block font-semibold">
                    Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefixes = ['PnR', 'Puffs', 'Bakery', 'Nashik'];
                      const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
                      setNewPassword(`${pref}@${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="text-amber-700 hover:text-amber-900 font-medium underline text-[10px] cursor-pointer"
                  >
                    ✨ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank for default: pnr@staff2026"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium cursor-pointer"
                >
                  Save &amp; Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal Dialog */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-stone-700" />
                <span>Edit Staff Member: {editingEmployee.name}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmployee(null);
                }}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Mobile Phone"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Access Role *
                  </label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium">
                      {editRole.replace('_', ' ')}
                    </div>
                  ) : (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as EmployeeRole)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 cursor-pointer"
                    >
                      <option value="OUTLET_MANAGER">Store Manager</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                      <option value="MARKETING_MANAGER">Marketing Manager</option>
                      <option value="SUPER_ADMIN">HQ Super Admin</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Assigned Store Scope
                  </label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium truncate">
                      {outlets
                        .find((o) => o.slug === editOutlet)
                        ?.name.replace("Puffs 'n' Rolls - ", '') || editOutlet}
                    </div>
                  ) : (
                    <select
                      value={
                        editRole === 'SUPER_ADMIN' || editRole === 'MARKETING_MANAGER'
                          ? 'all'
                          : editOutlet
                      }
                      disabled={
                        editRole === 'SUPER_ADMIN' || editRole === 'MARKETING_MANAGER'
                      }
                      onChange={(e) => setEditOutlet(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 disabled:opacity-50 cursor-pointer"
                    >
                      {(editRole === 'SUPER_ADMIN' ||
                        editRole === 'MARKETING_MANAGER') && (
                        <option value="all">All Outlets (HQ Global)</option>
                      )}
                      {outlets.map((o) => (
                        <option key={o.slug} value={o.slug}>
                          {o.name.replace("Puffs 'n' Rolls - ", '')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Designation Title
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  placeholder="e.g. Senior Shift Manager"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500 cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE (Authorized Access)</option>
                  <option value="INACTIVE">INACTIVE (Revoked / Suspended)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 rounded-full text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium cursor-pointer"
                >
                  Update &amp; Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: USER CREDENTIALS & PASSWORD MANAGER (STAFF & CUSTOMERS)
         ========================================================================= */}
      {isPasswordModalOpen && credentialTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Change Password &amp; Login Info
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Manage login credentials and share access details directly with user
                </p>
              </div>

              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setCredentialTarget(null);
                  setSavedCredentialShare(null);
                }}
                className="text-stone-400 hover:text-stone-900 p-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Summary Banner */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-stone-900 text-sm">
                    {credentialTarget.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-stone-200 text-stone-800">
                    {credentialTarget.type === 'STAFF' ? credentialTarget.role : 'CUSTOMER'}
                  </span>
                </div>
                <div className="text-stone-500 font-mono text-[11px] flex items-center gap-2">
                  <span>Login ID:</span>
                  <span className="font-bold text-stone-800">{credentialTarget.identifier}</span>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <span className="text-stone-400 block">Portal Access</span>
                <span className="text-emerald-700 font-semibold font-mono">
                  {credentialTarget.type === 'STAFF' ? '/admin/login' : '/login'}
                </span>
              </div>
            </div>

            {/* Password Input & Quick Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  New Password *
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-stone-400">Quick Generate:</span>
                  <button
                    type="button"
                    onClick={() => generatePassword('memorable')}
                    className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                    title="Generate bakery memorable password like PnR@4821"
                  >
                    ✨ Bakery Pass
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => generatePassword('pin')}
                    className="text-indigo-700 hover:text-indigo-900 font-semibold underline cursor-pointer"
                    title="Generate 6-digit numeric PIN"
                  >
                    🔢 PIN
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => generatePassword('strong')}
                    className="text-stone-700 hover:text-stone-950 font-semibold underline cursor-pointer"
                    title="Generate strong alphanumeric password"
                  >
                    🛡️ Strong
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter or generate new password"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSavingPassword || !newPasswordValue.trim()}
                className="w-full py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSavingPassword ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save &amp; Apply Password to Database</span>
                  </>
                )}
              </button>
            </div>

            {/* Credential Share Card (Live or Saved) */}
            {savedCredentialShare && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-950 font-serif">
                      Login Credentials Summary
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                    Active in DB
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs font-mono space-y-1.5 text-stone-800">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Portal:</span>
                    <a
                      href={savedCredentialShare.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold underline flex items-center gap-1 hover:text-emerald-900"
                    >
                      <span>{savedCredentialShare.portalUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Username / ID:</span>
                    <span className="font-bold">{savedCredentialShare.username || savedCredentialShare.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Active Password:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {savedCredentialShare.password}
                    </span>
                  </div>
                </div>

                {/* Instant Share Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(savedCredentialShare.shareText);
                      setCopyToast(true);
                      setTimeout(() => setCopyToast(false), 2500);
                    }}
                    className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copyToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-300" />
                        <span>Copy Complete Info</span>
                      </>
                    )}
                  </button>

                  {savedCredentialShare.whatsappUrl && (
                    <a
                      href={savedCredentialShare.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>Send on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW CUSTOMER ACCOUNT
         ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-stone-700" />
                <span>Onboard New Customer Account</span>
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="9822011223"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-700 block font-semibold">
                    Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefixes = ['PnR', 'Puffs', 'Bakery', 'Nashik'];
                      const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
                      setNewCustPassword(`${pref}@${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="text-amber-700 hover:text-amber-900 font-medium underline text-[10px] cursor-pointer"
                  >
                    ✨ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={newCustPassword}
                  onChange={(e) => setNewCustPassword(e.target.value)}
                  placeholder="Default: pnr@customer123"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Primary Delivery Address (Optional)
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Flat 102, Shrinath Heights, College Road"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-full text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium cursor-pointer"
                >
                  Save &amp; Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
