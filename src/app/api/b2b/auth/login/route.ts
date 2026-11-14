import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientSlug, username, password } = body;

    if (!clientSlug || !username || !password) {
      return NextResponse.json(
        { error: 'Client slug, username, and password are required.' },
        { status: 400 }
      );
    }

    const authResult = await b2bRepository.verifyClientLogin(clientSlug, username, password);

    if (!authResult) {
      return NextResponse.json(
        { error: 'Invalid client username or password for this organization.' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: authResult.user.id,
      name: authResult.user.name,
      username: authResult.user.username,
      clientId: authResult.client.id,
      clientSlug: authResult.client.slug,
      clientName: authResult.client.name,
      departmentId: authResult.department.id,
      departmentName: authResult.department.name,
      departmentCode: authResult.department.code,
    };

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      client: authResult.client,
      department: authResult.department,
    });

    // Set secure cookie for client portal
    response.cookies.set('pnr_b2b_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/b2b/auth/login Error]:', err);
    return NextResponse.json({ error: err.message || 'Login failed.' }, { status: 500 });
  }
}
