'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Employee, EmployeeRole, Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletSelector } from '@/components/admin/OutletSelector';
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
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const { user } = useAuth();
  const adminUser = user && user.role === 'ADMIN' ? user : null;
  const isOutletManager = Boolean(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all')
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all') ? adminUser.outletAccess[0] : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // New Employee Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<EmployeeRole>(isOutletManager ? 'KITCHEN_STAFF' : 'OUTLET_MANAGER');
  const [newOutlet, setNewOutlet] = useState(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all') ? adminUser.outletAccess[0] : 'college-road'
  );
  const [newDesignation, setNewDesignation] = useState('');

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

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [selectedOutlet]);

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
            outletSlug: newRole === 'SUPER_ADMIN' ? 'all' : newOutlet,
            designation:
              newDesignation ||
              (newRole === 'SUPER_ADMIN'
                ? 'HQ Administrator'
                : newRole === 'OUTLET_MANAGER'
                ? 'Outlet Store Manager'
                : 'Kitchen Specialist'),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ ${newName} added to staff directory`);
        setIsModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewDesignation('');
        fetchEmployees();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Create employee error', err);
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

  const getRoleBadge = (role: EmployeeRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-stone-700" />
            <span>Super Admin (HQ)</span>
          </span>
        );
      case 'OUTLET_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Store className="w-3 h-3 text-amber-700" />
            <span>Store Manager</span>
          </span>
        );
      case 'KITCHEN_STAFF':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ChefHat className="w-3 h-3 text-emerald-700" />
            <span>Kitchen Staff</span>
          </span>
        );
    }
  };

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
              Hierarchical Staff &amp; RBAC Directory
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Manage store managers, kitchen bakery staff, and brand HQ administrators across all outlets
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center gap-2 shrink-0 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

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
            <span>{outlets.find((o) => o.slug === selectedOutlet)?.name.replace("Puffs 'n' Rolls - ", '') || 'Your Kitchen Staff'}</span>
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
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider transition ${
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
                      : outlets.find((o) => o.slug === emp.outletSlug)?.name.replace(
                          "Puffs 'n' Rolls - ",
                          ''
                        ) || emp.outletSlug}
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

                <button
                  onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                  className="p-1 text-stone-400 hover:text-rose-600 transition"
                  title="Remove Employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
                className="text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-700 block font-semibold mb-1">Full Name</label>
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
                <label className="text-stone-700 block font-semibold mb-1">Email Address</label>
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
                <label className="text-stone-700 block font-semibold mb-1">Phone Number</label>
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
                  <label className="text-stone-700 block font-semibold mb-1">Access Role</label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium">
                      Kitchen Staff
                    </div>
                  ) : (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as EmployeeRole)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                    >
                      <option value="OUTLET_MANAGER">Store Manager</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                      <option value="SUPER_ADMIN">HQ Super Admin</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-stone-700 block font-semibold mb-1">Assigned Outlet</label>
                  {isOutletManager ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium truncate">
                      {outlets.find((o) => o.slug === newOutlet)?.name.replace("Puffs 'n' Rolls - ", '') || newOutlet}
                    </div>
                  ) : (
                    <select
                      value={newRole === 'SUPER_ADMIN' ? 'all' : newOutlet}
                      disabled={newRole === 'SUPER_ADMIN'}
                      onChange={(e) => setNewOutlet(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 disabled:opacity-50"
                    >
                      {newRole === 'SUPER_ADMIN' && <option value="all">All Outlets (HQ)</option>}
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
                <label className="text-stone-700 block font-semibold mb-1">Designation Title</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Shift Manager"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium"
                >
                  Save &amp; Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
