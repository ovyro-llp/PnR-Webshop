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
      const { name, email, phone, role, outletSlug, designation } = employeeData || {};
      if (!name || !email || !role) {
        return NextResponse.json(
          { success: false, error: 'Name, email, and role are required' },
          { status: 400 }
        );
      }

      const newEmp = await orderStore.createEmployeeAsync({
        name,
        email,
        phone: phone || '',
        role,
        outletSlug: outletSlug || 'all',
        designation: designation || role.replace('_', ' '),
        status: 'ACTIVE',
      });

      return NextResponse.json({
        success: true,
        employee: newEmp,
        message: `Employee ${name} created and permanently saved to PostgreSQL`,
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
