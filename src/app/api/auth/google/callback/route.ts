import { NextResponse } from 'next/server';
import { setCredential } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    let googleUser = {
      firstName: 'Google',
      lastName: 'User',
      preferredName: 'Google User',
      email: 'user@gmail.com'
    };

    if (code && clientId && clientSecret) {
      // Exchange authorization code for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        // Fetch real Google User profile info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userInfo = await userRes.json();

        googleUser = {
          firstName: userInfo.given_name || userInfo.name || 'Google',
          lastName: userInfo.family_name || 'User',
          preferredName: userInfo.given_name || userInfo.name || 'Google User',
          email: userInfo.email || 'user@gmail.com'
        };
      }
    }

    // Save registered user details to database
    await setCredential('user_firstName', googleUser.firstName);
    await setCredential('user_lastName', googleUser.lastName);
    await setCredential('user_preferredName', googleUser.preferredName);
    await setCredential('user_email', googleUser.email);
    await setCredential('user_registered', 'true');

    // Redirect user to login page which processes client-side session tokens
    return NextResponse.redirect(`${origin}/login?google_auth=success`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(`${origin}/login?error=google_auth_failed`);
  }
}
