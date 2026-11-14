import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const users = await b2bRepository.getClientUsers(clientId);
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/users GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, departmentId, name, username, password } = body;

    if (!clientId || !departmentId || !name || !username || !password) {
      return NextResponse.json(
        { error: 'Client, Locked Department, Name, Username, and Password are all required.' },
        { status: 400 }
      );
    }

    const user = await b2bRepository.createClientUser({
      clientId,
      departmentId,
      name,
      username,
      password,
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/users POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to create user.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    await b2bRepository.deleteClientUser(userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/users DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete user.' }, { status: 500 });
  }
}
