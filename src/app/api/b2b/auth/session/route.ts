import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('pnr_b2b_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
    }

    const cached = JSON.parse(sessionCookie.value);
    if (!cached || (!cached.clientId && !cached.clientSlug)) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
    }

    // Dynamically look up current client & department so any renaming in Admin is instantly reflected
    const client =
      (cached.clientId ? await b2bRepository.getClientById(cached.clientId) : null) ||
      (cached.clientSlug ? await b2bRepository.getClientBySlug(cached.clientSlug) : null);

    if (!client || !client.isActive) {
      const res = NextResponse.json({ authenticated: false, session: null }, { status: 401 });
      res.cookies.delete('pnr_b2b_session');
      return res;
    }

    const departments = await b2bRepository.getDepartmentsByClient(client.id);
    const department = departments.find((d) => d.id === cached.departmentId);

    const freshSession = {
      ...cached,
      clientId: client.id,
      clientSlug: client.slug,
      clientName: client.name,
      departmentName: department ? department.name : cached.departmentName,
    };

    const response = NextResponse.json({ authenticated: true, session: freshSession });

    // Update cookie with fresh clientName if it changed
    if (
      freshSession.clientName !== cached.clientName ||
      freshSession.clientSlug !== cached.clientSlug ||
      freshSession.departmentName !== cached.departmentName
    ) {
      response.cookies.set('pnr_b2b_session', JSON.stringify(freshSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete('pnr_b2b_session');
  return response;
}
