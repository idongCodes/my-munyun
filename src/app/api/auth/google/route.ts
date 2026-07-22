import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || 'settings';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    // Demo mode: redirect to callback with demo flag and state when credentials aren't configured
    return NextResponse.redirect(`${origin}/api/auth/google/callback?demo=true&state=${from}`);
  }

  const scope = 'openid profile email';
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `prompt=select_account&` +
    `state=${encodeURIComponent(from)}`;

  return NextResponse.redirect(googleAuthUrl);
}
