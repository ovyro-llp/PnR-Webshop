'use client';

import React, { useState, useEffect } from 'react';
import { Employee, EmployeeRole } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Store,
  ChefHat,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Power,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // New Employee Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<EmployeeRole>('OUTLET_MANAGER');
  const [newOutlet, setNewOutlet] = useState('college-road');
  const [newDesignation, setNewDesignation] = useState('');

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
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Super Admin (HQ)</span>
          </span>
        );
      case 'OUTLET_MANAGER':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Store className="w-3 h-3 text-indigo-400" />
            <span>Store Manager</span>
          </span>
        );
      case 'KITCHEN_STAFF':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ChefHat className="w-3 h-3 text-emerald-400" />
            <span>Kitchen Staff</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hierarchical Staff &amp; RBAC Directory
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage store managers, kitchen personnel, and HQ super administrators across all outlets
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shrink-0 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Outlet Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedOutlet('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              selectedOutlet === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Staff
          </button>
          {OUTLETS.map((outlet) => (
            <button
              key={outlet.slug}
              onClick={() => setSelectedOutlet(outlet.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedOutlet === outlet.slug
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {outlet.name.replace("Puffs 'n' Rolls - ", '')}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Directory Grid (Responsive cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isActive = emp.status === 'ACTIVE';

          return (
            <div
              key={emp.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-amber-400 font-serif">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {emp.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {emp.designation}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(emp.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider transition ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                    title="Click to toggle access"
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {getRoleBadge(emp.role)}
                  <span className="text-[11px] font-mono text-slate-400">
                    {emp.outletSlug === 'all'
                      ? 'HQ (All Outlets)'
                      : OUTLETS.find((o) => o.slug === emp.outletSlug)?.name.replace(
                          "Puffs 'n' Rolls - ",
                          ''
                        ) || emp.outletSlug}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {emp.lastLogin
                    ? `Active ${new Date(emp.lastLogin).toLocaleDateString()}`
                    : 'Invited'}
                </span>

                <button
                  onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Add Staff Member</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@puffsnrolls.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-medium mb-1">Access Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as EmployeeRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="OUTLET_MANAGER">Store Manager</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="SUPER_ADMIN">HQ Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block font-medium mb-1">Assigned Outlet</label>
                  <select
                    value={newRole === 'SUPER_ADMIN' ? 'all' : newOutlet}
                    disabled={newRole === 'SUPER_ADMIN'}
                    onChange={(e) => setNewOutlet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    {newRole === 'SUPER_ADMIN' && <option value="all">All Outlets (HQ)</option>}
                    {OUTLETS.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.name.replace("Puffs 'n' Rolls - ", '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Designation Title</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Shift Manager"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
