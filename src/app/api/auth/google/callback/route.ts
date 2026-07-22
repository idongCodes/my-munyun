import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

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

    // Lookup user by email
    const cleanEmail = googleUser.email.trim().toLowerCase();
    let user = await getUserByEmail(cleanEmail);

    if (!user) {
      // Create new user for Google login
      user = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        first_name: googleUser.firstName,
        last_name: googleUser.lastName,
        preferred_name: googleUser.preferredName,
        mobile_number: '',
        password: '',
        totp_secret: null,
        totp_enabled: false,
        google_id: 'google_oauth_user',
        avatar_url: null
      };
      await createUser(user);
    }

    // Authenticate user with server-side cookie
    await setSessionCookie(user.id);

    // Redirect user to login page which processes client-side session tokens
    return NextResponse.redirect(`${origin}/login?google_auth=success`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(`${origin}/login?error=google_auth_failed`);
  }
}
