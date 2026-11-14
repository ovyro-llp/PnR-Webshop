import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const departments = await b2bRepository.getDepartmentsByClient(clientId);
    return NextResponse.json({ departments });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/departments GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch departments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, name, code, contactPerson, phone } = body;

    if (!clientId || !name) {
      return NextResponse.json({ error: 'Client ID and Department Name are required.' }, { status: 400 });
    }

    const department = await b2bRepository.createDepartment({
      clientId,
      name,
      code,
      contactPerson,
      phone,
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/departments POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to create department.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
    }

    await b2bRepository.deleteDepartment(departmentId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/departments DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete department.' }, { status: 500 });
  }
}
