'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  Building2,
  Users,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
  Package,
  Layers,
  Edit2,
  Save,
  X,
  Copy,
  Check,
  Tag,
  ChefHat,
  ChevronRight,
  RefreshCw,
  Lock,
  ArrowRight,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Truck,
  Edit3,
} from 'lucide-react';
import {
  B2BClient,
  B2BDepartment,
  B2BClientCatalogItem,
  B2BClientUser,
  B2BOrder,
  B2BKitchenAggregateItem,
  B2BDepartmentPackingSlip,
} from '@/types';
import masterCatalog from '@/lib/data/master-catalog.json';

export default function AdminB2BPage() {
  // Navigation Tabs: 'ORDERS' | 'CLIENTS' | 'CATALOG' | 'USERS'
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CLIENTS' | 'CATALOG' | 'USERS'>('ORDERS');

  // Global State
  const [clients, setClients] = useState<B2BClient[]>([]);
  // Default to 'ALL' so orders across all clients are visible immediately
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Tab 1: Orders & Kitchen Aggregation State
  // Default to 'ALL' so no order is ever hidden by date mismatch!
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [dateFilterPreset, setDateFilterPreset] = useState<'ALL' | 'TOMORROW' | 'TODAY' | 'CUSTOM'>('ALL');
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [kitchenSheet, setKitchenSheet] = useState<B2BKitchenAggregateItem[]>([]);
  const [packingSlips, setPackingSlips] = useState<B2BDepartmentPackingSlip[]>([]);
  const [billingSummary, setBillingSummary] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    clientBreakdown: any[];
  } | null>(null);
  const [isLoadingAggregation, setIsLoadingAggregation] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Tab 2: Client Management & Editing State
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientSlug, setNewClientSlug] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Edit Client Modal State
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientSlug, setEditClientSlug] = useState('');
  const [editClientContact, setEditClientContact] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientOutlet, setEditClientOutlet] = useState('cycle-circle');
  const [editClientIsActive, setEditClientIsActive] = useState(true);

  // Tab 3: Catalog & Dynamic Pricing State
  const [clientCatalog, setClientCatalog] = useState<B2BClientCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // Custom Item Form
  const [customItemName, setCustomItemName] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('Puffs & Savories');
  const [customItemUnit, setCustomItemUnit] = useState('pcs');
  const [customItemPrice, setCustomItemPrice] = useState('25');

  // Tab 4: Departments & Logins State
  const [departments, setDepartments] = useState<B2BDepartment[]>([]);
  const [clientUsers, setClientUsers] = useState<B2BClientUser[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newUserDeptId, setNewUserDeptId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('pnr@corp123');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Load Clients on initial mount
  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch('/api/b2b/admin/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to fetch B2B clients', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // When switching to Catalog or Users tab, default to first client if 'ALL' is selected
  useEffect(() => {
    if (
      (activeTab === 'CATALOG' || activeTab === 'USERS') &&
      selectedClientId === 'ALL' &&
      clients.length > 0
    ) {
      setSelectedClientId(clients[0].id);
    }
  }, [activeTab, selectedClientId, clients]);

  // 2. Fetch Orders & Kitchen Aggregation
  const fetchAggregation = async () => {
    setIsLoadingAggregation(true);
    try {
      const clientParam =
        selectedClientId && selectedClientId !== 'ALL'
          ? `&clientId=${selectedClientId}`
          : '';
      const dateParam =
        selectedDate && selectedDate !== 'ALL'
          ? `date=${selectedDate}`
          : 'date=ALL';
      const statusParam =
        orderStatusFilter !== 'ALL' ? `&status=${orderStatusFilter}` : '';

      const [aggRes, ordersRes] = await Promise.all([
        fetch(`/api/b2b/admin/aggregate?${dateParam}${clientParam}`),
        fetch(`/api/b2b/orders?${dateParam}${clientParam}${statusParam}`),
      ]);

      const aggData = await aggRes.json();
      const ordersData = await ordersRes.json();

      setKitchenSheet(aggData.kitchenSheet || []);
      setPackingSlips(aggData.packingSlips || []);
      setBillingSummary(aggData.billingSummary || null);
      setOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Failed to fetch aggregation', err);
    } finally {
      setIsLoadingAggregation(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ORDERS') {
      fetchAggregation();
    }
  }, [activeTab, selectedDate, selectedClientId, orderStatusFilter]);

  // 3. Fetch Client Catalog & Pricing
  const fetchCatalog = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') return;
    setIsLoadingCatalog(true);
    try {
      const res = await fetch(`/api/b2b/admin/catalog?clientId=${selectedClientId}`);
      const data = await res.json();
      setClientCatalog(data.items || []);
    } catch (err) {
      console.error('Failed to fetch client catalog', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CATALOG' && selectedClientId && selectedClientId !== 'ALL') {
      fetchCatalog();
    }
  }, [activeTab, selectedClientId]);

  // 4. Fetch Departments and Users
  const fetchDeptAndUsers = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') return;
    try {
      const [deptRes, userRes] = await Promise.all([
        fetch(`/api/b2b/admin/departments?clientId=${selectedClientId}`),
        fetch(`/api/b2b/admin/users?clientId=${selectedClientId}`),
      ]);
      const deptData = await deptRes.json();
      const userData = await userRes.json();
      setDepartments(deptData.departments || []);
      setClientUsers(userData.users || []);
      if (deptData.departments && deptData.departments.length > 0 && !newUserDeptId) {
        setNewUserDeptId(deptData.departments[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch departments & users', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS' && selectedClientId && selectedClientId !== 'ALL') {
      fetchDeptAndUsers();
    }
  }, [activeTab, selectedClientId]);

  // Helpers
  const selectedClient = useMemo(() => {
    if (selectedClientId === 'ALL') return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Date Filter Preset handlers
  const handleDatePreset = (preset: 'ALL' | 'TOMORROW' | 'TODAY') => {
    setDateFilterPreset(preset);
    if (preset === 'ALL') {
      setSelectedDate('ALL');
    } else if (preset === 'TODAY') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } else if (preset === 'TOMORROW') {
      const tom = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setSelectedDate(tom.toISOString().split('T')[0]);
    }
  };

  // Handle Client Creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientSlug) return;

    try {
      const res = await fetch('/api/b2b/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          slug: newClientSlug,
          contactPerson: newClientContact,
          phone: newClientPhone,
          email: newClientEmail,
          billingAddress: newClientAddress,
        }),
      });

      if (res.ok) {
        setIsAddClientModalOpen(false);
        setNewClientName('');
        setNewClientSlug('');
        setNewClientContact('');
        setNewClientPhone('');
        setNewClientEmail('');
        setNewClientAddress('');
        await fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create client.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating client.');
    }
  };

  // Open Edit Client Modal
  const openEditClientModal = (client: B2BClient) => {
    setEditingClientId(client.id);
    setEditClientName(client.name);
    setEditClientSlug(client.slug);
    setEditClientContact(client.contactPerson || '');
    setEditClientPhone(client.phone || '');
    setEditClientEmail(client.email || '');
    setEditClientAddress(client.billingAddress || '');
    setEditClientOutlet(client.fulfillingOutletSlug || 'cycle-circle');
    setEditClientIsActive(client.isActive);
    setIsEditClientModalOpen(true);
  };

  // Handle Client Update
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientId || !editClientName || !editClientSlug) return;

    try {
      const res = await fetch('/api/b2b/admin/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClientId,
          name: editClientName,
          slug: editClientSlug,
          contactPerson: editClientContact,
          phone: editClientPhone,
          email: editClientEmail,
          billingAddress: editClientAddress,
          fulfillingOutletSlug: editClientOutlet,
          isActive: editClientIsActive,
        }),
      });

      if (res.ok) {
        setIsEditClientModalOpen(false);
        await Promise.all([
          fetchClients(),
          fetchAggregation(),
          fetchDeptAndUsers(),
          fetchCatalog(),
        ]);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update client.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating client.');
    }
  };

  // Delete Client
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete corporate client "${clientName}"?\n\nThis will permanently delete the client, all its departments, custom catalog pricing, employee logins, and orders.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/b2b/admin/clients?clientId=${clientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const remaining = clients.filter((c) => c.id !== clientId);
        setClients(remaining);
        if (selectedClientId === clientId) {
          setSelectedClientId(remaining.length > 0 ? remaining[0].id : 'ALL');
        }
        await fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete client.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting client.');
    }
  };

  // Handle Price Save
  const handleSavePrice = async (itemId: string) => {
    const parsed = parseFloat(editingPriceValue);
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid price.');
      return;
    }

    const item = clientCatalog.find((c) => c.id === itemId);
    if (!item || !selectedClientId) return;

    try {
      const res = await fetch('/api/b2b/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          b2bPrice: parsed,
        }),
      });

      if (res.ok) {
        setEditingPriceId(null);
        await fetchCatalog();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  // Add Item from Master Catalog
  const handleAddMasterItem = async (masterProduct: any, customPrice: number) => {
    if (!selectedClientId) return;
    try {
      const res = await fetch('/api/b2b/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          productId: masterProduct.id,
          productName: masterProduct.name,
          category: masterProduct.category,
          unit: 'pcs',
          b2bPrice: customPrice,
        }),
      });

      if (res.ok) {
        await fetchCatalog();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    }
  };

  // Add Bespoke Custom Item (No photo required)
  const handleCreateCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !customItemName) return;

    try {
      const res = await fetch('/api/b2b/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          productName: customItemName,
          category: customItemCategory,
          unit: customItemUnit,
          b2bPrice: parseFloat(customItemPrice) || 0,
        }),
      });

      if (res.ok) {
        setIsAddCustomModalOpen(false);
        setCustomItemName('');
        await fetchCatalog();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add custom item');
    }
  };

  // Delete Catalog Item
  const handleDeleteCatalogItem = async (itemId: string) => {
    if (!confirm('Remove this product from the client catalog?')) return;
    try {
      await fetch(
        `/api/b2b/admin/catalog?clientId=${selectedClientId}&itemId=${itemId}`,
        { method: 'DELETE' }
      );
      await fetchCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newDeptName) return;

    try {
      const res = await fetch('/api/b2b/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          name: newDeptName,
          code: newDeptCode,
        }),
      });
      if (res.ok) {
        setNewDeptName('');
        setNewDeptCode('');
        await fetchDeptAndUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await fetch(`/api/b2b/admin/departments?departmentId=${deptId}`, {
        method: 'DELETE',
      });
      await fetchDeptAndUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Client User (With Pre-Locked Department)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newUserDeptId || !newUserName || !newUserUsername || !newUserPassword) {
      alert('Please fill out all employee credential fields and assign a department.');
      return;
    }

    try {
      const res = await fetch('/api/b2b/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          departmentId: newUserDeptId,
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
        }),
      });

      if (res.ok) {
        setNewUserName('');
        setNewUserUsername('');
        await fetchDeptAndUsers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create user login.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating user.');
    }
  };

  // Delete Client User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Revoke access for this client employee?')) return;
    try {
      await fetch(`/api/b2b/admin/users?userId=${userId}`, { method: 'DELETE' });
      await fetchDeptAndUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: B2BOrder['status']) => {
    try {
      await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      await fetchAggregation();
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Login Credentials helper
  const handleCopyCredentials = (user: B2BClientUser, clientSlug: string) => {
    const portalUrl = `${window.location.origin}/b2b/${clientSlug}`;
    const text = `*Puffs 'n' Rolls Corporate Requisition Portal*\nCompany: ${selectedClient?.name}\nAssigned Department: ${user.departmentName} (Pre-locked)\nPortal URL: ${portalUrl}\nLogin ID: ${user.username}\nPassword: [As provided by PnR Admin]`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Status badge styling helper
  const getStatusBadge = (status: B2BOrder['status']) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BAKING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PACKED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              B2B Accounts Hub
            </span>
            <span className="text-xs text-stone-400">
              Production-Ready Corporate Requisitions
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-amber-400" />
            <span>B2B Orders & Corporate Accounts</span>
          </h1>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Live order tracking, client management with full editing & deletion,
            client-specific dynamic pricing, and 1-click kitchen bake sheets.
          </p>
        </div>

        {/* Global Client Scope Selector */}
        <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/80 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-400">
              Active Client Scope:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-stone-900 text-white font-bold">
                🌟 All Corporate Clients (Global View)
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Mobile-Friendly Horizontal Scroll) */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'ORDERS'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ChefHat className="w-4 h-4 text-amber-400" />
          <span>⚡ Kitchen Orders & Bake Sheet ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CLIENTS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'CLIENTS'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Corporate Clients ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'CATALOG'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Dynamic Catalogs & Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'USERS'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Departments & Employee Logins</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: Live Orders & Kitchen Aggregation                           */}
      {/* =================================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 1. Prominent Today Date Banner & Kitchen Controls */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bakery Kitchen Operations
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-stone-900 mt-0.5">
                  {dateFilterPreset === 'TODAY'
                    ? `Today's Shift — ${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`
                    : dateFilterPreset === 'TOMORROW'
                    ? `Tomorrow's Shift — ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`
                    : dateFilterPreset === 'CUSTOM'
                    ? `Orders for ${selectedDate}`
                    : "All Active Requisition Orders"}
                </h2>
              </div>

              {/* Quick Print Button */}
              <button
                onClick={() => window.print()}
                className="self-start sm:self-auto px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print Production Sheets</span>
              </button>
            </div>

            {/* Date Switcher Pills (Mobile-Friendly) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-500 uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Date:
              </span>
              <button
                onClick={() => handleDatePreset('TODAY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateFilterPreset === 'TODAY'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                ⚡ Today's Orders
              </button>
              <button
                onClick={() => handleDatePreset('TOMORROW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateFilterPreset === 'TOMORROW'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                ⚡ Tomorrow's Shift
              </button>
              <button
                onClick={() => handleDatePreset('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateFilterPreset === 'ALL'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Dates ({orders.length})
              </button>

              {/* Custom Date Input */}
              <input
                type="date"
                value={selectedDate === 'ALL' ? '' : selectedDate}
                onChange={(e) => {
                  setDateFilterPreset('CUSTOM');
                  setSelectedDate(e.target.value || 'ALL');
                }}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900"
              />

              <button
                onClick={fetchAggregation}
                title="Refresh live orders"
                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg ml-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 📋 LIVE REQUISITIONS & ORDERS TABLE (The Primary View)          */}
          {/* =============================================================== */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-300" />
                  <span>Live Corporate Requisition Orders</span>
                </h3>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Real-time department orders received from client portals
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-white/10 rounded-full font-bold">
                {orders.length} Total Orders
              </span>
            </div>

            {isLoadingAggregation ? (
              <div className="p-12 text-center text-xs text-stone-500">
                Loading live requisition orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                No orders found for the selected date or client scope.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 hover:bg-stone-50/60 transition-colors space-y-3"
                  >
                    {/* Header Row: Focus on Client & Department */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                            {clients.find((c) => c.id === order.clientId)?.name || order.clientName}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                            Dept: {order.departmentName}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            #{order.orderNumber}
                          </span>
                        </div>
                      </div>

                      {/* Status & Transitions */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>

                        {/* Status Updater Buttons */}
                        {order.status === 'RECEIVED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <span>Confirm</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'BAKING')}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <span>Start Baking</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {order.status === 'BAKING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PACKED')}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <span>Mark Packed</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {order.status === 'PACKED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <span>Dispatch / Deliver</span>
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MAIN FOCUS: Products & Quantities in High-Contrast Prominent Rows */}
                    <div className="bg-white rounded-xl border-2 border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-2xs">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                                {item.productName}
                              </h4>
                              <span className="text-[11px] text-stone-500 font-medium uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {/* Large, high-visibility quantity badge */}
                          <div className="flex items-baseline gap-1.5 bg-[#FAF8F5] border-2 border-stone-900 px-4 py-1.5 rounded-xl shrink-0 shadow-xs">
                            <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
                              {item.quantity}
                            </span>
                            <span className="text-xs font-bold text-stone-600 uppercase">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <span className="font-bold">Requisition Note: </span>
                        {order.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ⚡ Aggregated Kitchen Bake Sheet */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-900 to-stone-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-amber-300" />
                  <span>Consolidated Kitchen Production Sheet (For Bakers)</span>
                </h3>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Combines matching products across all departments for ovens
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-white/10 rounded-full font-bold">
                {kitchenSheet.length} Distinct Items to Bake
              </span>
            </div>

            {kitchenSheet.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No active bake sheet data for this filter.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {kitchenSheet.map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 hover:bg-amber-50/20 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h4 className="text-lg sm:text-xl font-black text-stone-900 mt-1 leading-tight">
                          {item.productName}
                        </h4>
                      </div>

                      {/* Large Oven Total Badge */}
                      <div className="flex items-baseline gap-2 bg-amber-50 border-2 border-amber-600 px-4 py-2 rounded-xl self-start sm:self-auto shrink-0 shadow-xs">
                        <span className="text-xs uppercase font-extrabold text-amber-800">
                          Total To Bake:
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
                          {item.totalQuantity}
                        </span>
                        <span className="text-xs font-bold text-amber-800 uppercase">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Department breakdown pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Department Breakdown:
                      </span>
                      {item.departments.map((dept, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 shadow-2xs"
                        >
                          <span className="font-bold text-stone-900">
                            {dept.clientName} <span className="text-stone-500">({dept.departmentName})</span>:
                          </span>{' '}
                          <span className="text-amber-900 font-black font-mono ml-1">
                            {dept.quantity} {item.unit}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Packing Slips */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  📦 Department Packing & Dispatch Slips
                </h3>
                <p className="text-xs text-stone-500">
                  Individual crate labels for delivery dispatch runners
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packingSlips.map((slip) => (
                <div
                  key={slip.orderId}
                  className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between border-b border-stone-200 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {slip.orderNumber}
                      </span>
                      <h4 className="text-sm font-black text-stone-900">
                        {slip.clientName}
                      </h4>
                      <p className="text-xs font-bold text-emerald-800">
                        Dept: {slip.departmentName}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-stone-200 text-stone-800 rounded">
                      {slip.deliveryTimeSlot.split(' ')[0]}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {slip.items.map((i, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white border border-stone-200/80 shadow-2xs"
                      >
                        <span className="text-stone-900 font-bold">{i.productName}</span>
                        <div className="flex items-baseline gap-1 font-mono font-black text-stone-900 text-sm">
                          <span>{i.quantity}</span>
                          <span className="text-[11px] font-semibold text-stone-500 uppercase">{i.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {slip.notes && (
                    <div className="text-[11px] bg-amber-50 border border-amber-200 rounded p-1.5 text-amber-900">
                      <span className="font-bold">Note: </span>
                      {slip.notes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-500">
                      Total Units: {slip.totalUnits}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white border border-stone-300 hover:bg-stone-100 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: Corporate Clients Manager & Editing                          */}
      {/* =================================================================== */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Corporate Client Accounts
              </h3>
              <p className="text-xs text-stone-500">
                Manage corporate entities, custom URLs, editing, and deletion
              </p>
            </div>
            <button
              onClick={() => setIsAddClientModalOpen(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Corporate Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4 hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-black text-stone-900">
                        {client.name}
                      </h4>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded bg-stone-100 text-stone-600 font-mono text-xs font-bold">
                        slug: {client.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          client.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditClientModal(client)}
                        title={`Edit ${client.name}`}
                        className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        title={`Delete ${client.name}`}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 mt-3">
                    {client.contactPerson && (
                      <p>
                        <strong className="text-stone-900">Contact:</strong>{' '}
                        {client.contactPerson}
                      </p>
                    )}
                    {client.phone && (
                      <p>
                        <strong className="text-stone-900">Phone:</strong>{' '}
                        {client.phone}
                      </p>
                    )}
                    {client.email && (
                      <p>
                        <strong className="text-stone-900">Email:</strong>{' '}
                        {client.email}
                      </p>
                    )}
                    {client.billingAddress && (
                      <p className="truncate">
                        <strong className="text-stone-900">Address:</strong>{' '}
                        {client.billingAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <Link
                    href={`/b2b/${client.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveTab('CATALOG');
                      }}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 underline"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveTab('USERS');
                      }}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 underline"
                    >
                      Logins
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Client Modal */}
          {isAddClientModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">
                    Add Corporate Client
                  </h3>
                  <button
                    onClick={() => setIsAddClientModalOpen(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => {
                        setNewClientName(e.target.value);
                        if (!newClientSlug) {
                          setNewClientSlug(
                            e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
                          );
                        }
                      }}
                      placeholder="e.g. Wipro Technologies"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Custom URL Slug * (e.g. shop.puffsnrolls.com/b2b/[slug])
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientSlug}
                      onChange={(e) => setNewClientSlug(e.target.value)}
                      placeholder="e.g. wipro"
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={newClientContact}
                      onChange={(e) => setNewClientContact(e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="+91 98220 00000"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="admin@wipro.com"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Billing / Campus Address
                    </label>
                    <textarea
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      placeholder="Campus address, Nashik"
                      className="w-full px-3 py-2 border rounded-lg h-16"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddClientModalOpen(false)}
                      className="flex-1 py-2.5 bg-stone-100 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg font-bold"
                    >
                      Create Client
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Client Modal */}
          {isEditClientModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">
                    Edit Corporate Client
                  </h3>
                  <button
                    onClick={() => setIsEditClientModalOpen(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateClient} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      URL Slug * (URL: /b2b/{editClientSlug})
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientSlug}
                      onChange={(e) => setEditClientSlug(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={editClientContact}
                      onChange={(e) => setEditClientContact(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editClientPhone}
                        onChange={(e) => setEditClientPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editClientEmail}
                        onChange={(e) => setEditClientEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Billing Address
                    </label>
                    <textarea
                      value={editClientAddress}
                      onChange={(e) => setEditClientAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg h-16"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-stone-700">Client Status:</span>
                    <button
                      type="button"
                      onClick={() => setEditClientIsActive(!editClientIsActive)}
                      className={`px-3 py-1 rounded-full font-bold text-xs ${
                        editClientIsActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {editClientIsActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditClientModalOpen(false)}
                      className="flex-1 py-2.5 bg-stone-100 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: Dynamic Catalogs & Contract Pricing                         */}
      {/* =================================================================== */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-stone-900">
                {selectedClient?.name || 'Client'} — Approved Catalog & Rates
              </h3>
              <p className="text-xs text-stone-500">
                Configure client-specific products and customized contract
                pricing. Products do not require photos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddMasterModalOpen(true)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add from Master Catalog</span>
              </button>

              <button
                onClick={() => setIsAddCustomModalOpen(true)}
                className="px-3 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Bespoke B2B Item</span>
              </button>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                {clientCatalog.length} Approved Products for {selectedClient?.name || 'Selected Client'}
              </span>
              <span className="text-[11px] text-stone-500">
                Click price to edit directly
              </span>
            </div>

            {isLoadingCatalog ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Loading approved catalog...
              </div>
            ) : clientCatalog.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500">
                No products configured for {selectedClient?.name || 'this client'} yet. Click
                "Add from Master Catalog" or "Create Bespoke B2B Item" above.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {clientCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-600">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-stone-900">
                          {item.productName}
                        </h4>
                      </div>
                      <span className="text-xs text-stone-400">
                        Unit: {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {editingPriceId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="w-20 px-2 py-1 bg-white border border-stone-400 rounded text-xs font-black text-stone-900"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1.5 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPriceId(item.id);
                            setEditingPriceValue(item.b2bPrice.toString());
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100/50 rounded-lg text-xs font-black text-stone-900 flex items-center gap-1.5 group transition-colors"
                        >
                          <span>₹{item.b2bPrice.toFixed(2)}</span>
                          <Edit2 className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCatalogItem(item.id)}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal: Add from Master Catalog */}
          {isAddMasterModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-black text-stone-900">
                    Add Items from Bakery Master Catalog
                  </h3>
                  <button onClick={() => setIsAddMasterModalOpen(false)}>
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={masterSearchQuery}
                    onChange={(e) => setMasterSearchQuery(e.target.value)}
                    placeholder="Search master catalog..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs"
                  />
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                  {masterCatalog
                    .filter((p: any) =>
                      p.name.toLowerCase().includes(masterSearchQuery.toLowerCase())
                    )
                    .slice(0, 50)
                    .map((product: any) => {
                      const isAlreadyAdded = clientCatalog.some(
                        (c) =>
                          c.productName.toLowerCase() === product.name.toLowerCase()
                      );
                      return (
                        <div
                          key={product.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400">
                              {product.category}
                            </span>
                            <h4 className="text-xs font-bold text-stone-900">
                              {product.name}
                            </h4>
                            <span className="text-[11px] text-stone-500">
                              Standard Store Price: ₹{product.price}
                            </span>
                          </div>

                          {isAlreadyAdded ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                              ✓ In Catalog
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleAddMasterItem(product, product.price)
                              }
                              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg"
                            >
                              Add to Client (₹{product.price})
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Create Bespoke B2B Item */}
          {isAddCustomModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">
                    Create Bespoke Commercial Item
                  </h3>
                  <button onClick={() => setIsAddCustomModalOpen(false)}>
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustomItem} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="e.g. VIP High-Tea Box, Sugar-Free Rusk Tray"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={customItemCategory}
                        onChange={(e) => setCustomItemCategory(e.target.value)}
                        placeholder="e.g. Savories"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        value={customItemUnit}
                        onChange={(e) => setCustomItemUnit(e.target.value)}
                        placeholder="e.g. pcs, box, kg"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Contracted B2B Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-bold"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCustomModalOpen(false)}
                      className="flex-1 py-2.5 bg-stone-100 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg font-bold"
                    >
                      Save Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: Departments & Employee Logins                               */}
      {/* =================================================================== */}
      {activeTab === 'USERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Client Departments */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <h3 className="text-base font-black text-stone-900">
                Departments for {selectedClient?.name || 'Selected Client'}
              </h3>
              <p className="text-xs text-stone-500">
                Departments can only be created or deleted by the bakery Admin.
              </p>

              {/* Add Department Form */}
              <form onSubmit={handleAddDepartment} className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="Department Name (e.g. Executive Canteen)"
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      placeholder="Code (e.g. EC-01)"
                      className="w-full px-3 py-2 border rounded-lg text-xs uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Department</span>
                </button>
              </form>

              {/* Department Roster */}
              <div className="divide-y divide-stone-100 pt-3">
                {departments.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3 text-center">
                    No departments added yet.
                  </p>
                ) : (
                  departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {dept.name}
                        </span>
                        {dept.code && (
                          <span className="text-[10px] font-mono text-stone-400">
                            Code: {dept.code}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="Delete department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Client Employee Logins (Pre-Locked Department) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Client Employee Credentials
                </h3>
                <p className="text-xs text-stone-500">
                  Credentials lock each employee strictly to their designated department.
                </p>
              </div>

              {/* Create User Form */}
              <form onSubmit={handleCreateUser} className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Locked Department * (Cannot be changed by employee)</span>
                  </label>
                  <select
                    value={newUserDeptId}
                    onChange={(e) => setNewUserDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-emerald-900 font-bold"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Employee Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Rahul Patil"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder="e.g. tcs_canteen1"
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={departments.length === 0}
                  className="w-full py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Pre-Locked Login</span>
                </button>
              </form>

              {/* Logins List */}
              <div className="divide-y divide-stone-100 pt-3">
                {clientUsers.map((user) => (
                  <div
                    key={user.id}
                    className="py-3 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900">
                          {user.name}
                        </span>
                        <span className="font-mono text-stone-400">
                          ({user.username})
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked: {user.departmentName}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopyCredentials(user, selectedClient?.slug || '')
                        }
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[11px] font-bold flex items-center gap-1 text-stone-700"
                      >
                        {copiedId === user.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Login</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
