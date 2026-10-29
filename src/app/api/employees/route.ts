import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { Employee } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outlet = searchParams.get('outlet') || 'all';

    const employees = orderStore.getEmployees(outlet);
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

      const newEmp = orderStore.createEmployee({
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
        message: `Employee ${name} created successfully`,
      });
    }

    if (action === 'UPDATE') {
      if (!employeeId || !updates) {
        return NextResponse.json(
          { success: false, error: 'employeeId and updates are required' },
          { status: 400 }
        );
      }

      const updated = orderStore.updateEmployee(employeeId, updates);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        employee: updated,
        message: 'Employee updated successfully',
      });
    }

    if (action === 'TOGGLE_STATUS') {
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'employeeId is required' },
          { status: 400 }
        );
      }

      const existing = (orderStore.getEmployees() as Employee[]).find((e) => e.id === employeeId);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = orderStore.updateEmployee(employeeId, { status: newStatus });

      return NextResponse.json({
        success: true,
        employee: updated,
        message: `Status updated to ${newStatus}`,
      });
    }

    if (action === 'DELETE') {
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'employeeId is required' },
          { status: 400 }
        );
      }

      const deleted = orderStore.deleteEmployee(employeeId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Employee removed' : 'Employee not found',
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
