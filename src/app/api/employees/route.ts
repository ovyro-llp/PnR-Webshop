import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { Employee } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outlet = searchParams.get('outlet') || 'all';

    const employees = await orderStore.getEmployeesAsync(outlet);
    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('Failed to get employees:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, employeeId, employeeData, updates } = body;

    if (action === 'CREATE') {
      const { name, email, phone, role, outletSlug, designation, password } = employeeData || {};
      if (!name || !email || !role) {
        return NextResponse.json(
          { success: false, error: 'Name, email, and role are required' },
          { status: 400 }
        );
      }

      const assignedPassword = password && password.trim() ? password.trim() : 'pnr@staff2026';

      const newEmp = await orderStore.createEmployeeAsync({
        name,
        email,
        phone: phone || '',
        role,
        outletSlug: outletSlug || 'all',
        designation: designation || role.replace('_', ' '),
        status: 'ACTIVE',
        password: assignedPassword,
      });

      const cleanPhone = (phone || '').replace(/\D/g, '');
      const shareText = `🥐 *Puffs 'n' Rolls - Staff Login Credentials*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Name:* ${name}\n` +
        `🏷️ *Role:* ${role}\n` +
        `🌐 *Portal:* https://shop.puffsnrolls.com/admin/login\n` +
        `📧 *Login Email:* ${email}\n` +
        `🔑 *Password:* ${assignedPassword}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Please keep your credentials confidential._`;

      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(shareText)}`
        : undefined;

      return NextResponse.json({
        success: true,
        employee: newEmp,
        message: `Employee ${name} created and permanently saved to PostgreSQL`,
        loginInfo: {
          portalUrl: 'https://shop.puffsnrolls.com/admin/login',
          username: email,
          phone: phone || '',
          password: assignedPassword,
          role,
          name,
          shareText,
          whatsappUrl,
        },
      });
    }

    if (action === 'RESET_PASSWORD') {
      const { newPassword } = body;
      if (!employeeId || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'employeeId and newPassword are required' },
          { status: 400 }
        );
      }

      if (newPassword.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 4 characters long' },
          { status: 400 }
        );
      }

      const updated = await orderStore.updateEmployeeAsync(employeeId, {
        password: newPassword.trim(),
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      const cleanPhone = (updated.phone || '').replace(/\D/g, '');
      const shareText = `🥐 *Puffs 'n' Rolls - Updated Staff Credentials*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Name:* ${updated.name}\n` +
        `🏷️ *Role:* ${updated.role}\n` +
        `🌐 *Portal:* https://shop.puffsnrolls.com/admin/login\n` +
        `📧 *Login Email:* ${updated.email}\n` +
        `🔑 *New Password:* ${newPassword.trim()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Please log in and keep your credentials confidential._`;

      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(shareText)}`
        : undefined;

      return NextResponse.json({
        success: true,
        employee: updated,
        message: `Password updated for ${updated.name} and permanently saved to PostgreSQL`,
        loginInfo: {
          portalUrl: 'https://shop.puffsnrolls.com/admin/login',
          username: updated.email,
          phone: updated.phone || '',
          password: newPassword.trim(),
          role: updated.role,
          name: updated.name,
          shareText,
          whatsappUrl,
        },
      });
    }

    if (action === 'VERIFY_LOGIN') {
      const { email, password } = body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      if (!cleanEmail || !cleanPass) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const allEmployees = await orderStore.getEmployeesAsync();
      const emp = allEmployees.find(
        (e) => (e.email || '').trim().toLowerCase() === cleanEmail
      );

      // Check known role default fallback passwords
      const isMasterAdminPass =
        (cleanEmail === 'admin@puffsnrolls.com' || cleanEmail === 'admin') &&
        (cleanPass === 'pnr@admin2026' || cleanPass === 'admin');

      const isMarketingPass =
        cleanEmail === 'marketing@puffsnrolls.com' &&
        (cleanPass === 'pnr@marketing2026' || cleanPass === 'admin' || cleanPass === 'pnr123');

      const isCycleCirclePass =
        (cleanEmail === 'cyclecircle@puffsnrolls.com' || cleanEmail === 'collegeroad@puffsnrolls.com') &&
        (cleanPass === 'cycle2026' || cleanPass === 'college2026' || cleanPass === 'admin' || cleanPass === 'pnr123');

      const isNdPatelPass =
        (cleanEmail === 'ndpatel@puffsnrolls.com' || cleanEmail === 'ndpatelroad@puffsnrolls.com') &&
        (cleanPass === 'ndpatel2026' || cleanPass === 'admin' || cleanPass === 'pnr123');

      const isGangapurPass =
        (cleanEmail === 'gangapur@puffsnrolls.com' || cleanEmail === 'gangapurroad@puffsnrolls.com') &&
        (cleanPass === 'gangapur2026' || cleanPass === 'admin' || cleanPass === 'pnr123');

      const isKitchenPass =
        cleanEmail === 'kitchen.cr@puffsnrolls.com' &&
        (cleanPass === 'kitchen2026' || cleanPass === 'admin' || cleanPass === 'pnr123');

      if (!emp) {
        // Fallback for master super admin even if not in roster
        if (isMasterAdminPass) {
          return NextResponse.json({
            success: true,
            user: {
              id: 'admin-super',
              name: 'Headquarters Operations',
              email: 'admin@puffsnrolls.com',
              role: 'ADMIN',
              employeeRole: 'SUPER_ADMIN',
              outletAccess: ['all'],
              title: 'Master Brand Administrator',
            },
          });
        }

        return NextResponse.json(
          { success: false, error: 'No employee account found with this email address' },
          { status: 401 }
        );
      }

      if (emp.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'This employee account is inactive. Please contact the administrator.' },
          { status: 403 }
        );
      }

      const isPasswordMatch =
        (emp.password && emp.password === cleanPass) ||
        isMasterAdminPass ||
        isMarketingPass ||
        isCycleCirclePass ||
        isNdPatelPass ||
        isGangapurPass ||
        isKitchenPass;

      if (!isPasswordMatch) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password. Please verify and try again.' },
          { status: 401 }
        );
      }

      // Update lastLogin timestamp asynchronously
      orderStore.updateEmployeeAsync(emp.id, { lastLogin: new Date().toISOString() }).catch(() => {});

      return NextResponse.json({
        success: true,
        user: {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: 'ADMIN',
          employeeRole: emp.role,
          outletAccess: emp.outletSlug === 'all' ? ['all'] : [emp.outletSlug],
          title: emp.designation,
        },
      });
    }

    if (action === 'UPDATE') {
      if (!employeeId || !updates) {
        return NextResponse.json(
          { success: false, error: 'employeeId and updates are required' },
          { status: 400 }
        );
      }

      const updated = await orderStore.updateEmployeeAsync(employeeId, updates);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        employee: updated,
        message: 'Employee updated and permanently saved to PostgreSQL',
      });
    }

    if (action === 'TOGGLE_STATUS') {
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'employeeId is required' },
          { status: 400 }
        );
      }

      const existingEmployees = await orderStore.getEmployeesAsync();
      const existing = existingEmployees.find((e) => e.id === employeeId);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await orderStore.updateEmployeeAsync(employeeId, { status: newStatus });

      return NextResponse.json({
        success: true,
        employee: updated,
        message: `Status updated to ${newStatus} and permanently saved to PostgreSQL`,
      });
    }

    if (action === 'DELETE') {
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'employeeId is required' },
          { status: 400 }
        );
      }

      const deleted = await orderStore.deleteEmployeeAsync(employeeId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Employee removed and synced to PostgreSQL' : 'Employee not found',
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Employee management error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
