import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('pnr_b2b_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, session });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete('pnr_b2b_session');
  return response;
}
