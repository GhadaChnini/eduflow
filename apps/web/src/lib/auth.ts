
import { Pool, neonConfig } from '@neondatabase/serverless';
import { argon2Verify } from 'argon2-wasm-edge';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { verifyPassword } from 'better-auth/crypto';
import { bearer } from 'better-auth/plugins';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Origins we accept auth requests from. Include every URL the app may be
// served under so better-auth's CSRF check doesn't reject legitimate requests
// as "Invalid origin". The request's own origin + known sandbox / published
// URLs + the mobile iframe proxy URL are all listed here.
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.EXPO_PUBLIC_PROXY_BASE_URL,
  process.env.NEXT_PUBLIC_CREATE_BASE_URL,
  process.env.NEXT_PUBLIC_CREATE_HOST
    ? `https://${process.env.NEXT_PUBLIC_CREATE_HOST}`
    : null,
].filter((v): v is string => Boolean(v));

// Social providers self-activate when the platform has injected their OAuth
// credentials (set in project settings → Authentication, pushed in as env
// vars). A provider with missing credentials is simply not registered, so the
// corresponding sign-in button never reaches a half-configured backend.
const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? {
        apple: {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
          // Required to verify the identity token from native "Sign in with
          // Apple"; harmless when only web is used.
          ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER
            ? {
                appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
              }
            : {}),
        },
      }
    : {}),
};

async function verifyCompatiblePassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}) {
  if (hash.startsWith('$argon2')) {
    return argon2Verify({
      hash,
      password,
    });
  }

  return verifyPassword({
    hash,
    password,
  });
}

export const auth = betterAuth({
  database: pool,
  trustedOrigins,
  socialProviders,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      verify: verifyCompatiblePassword,
    },
  },
  hooks: {
    // better-auth's /sign-up/email schema requires `name`. Generated user apps
    // often collect only email+password, so backfill a name from the email
    // local-part to keep signup working without a visible name field.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return;
      const body = ctx.body as { email?: unknown; name?: unknown } | undefined;
      if (!body || typeof body.email !== 'string') return;
      if (typeof body.name === 'string' && body.name.trim().length > 0) return;
      const derived = body.email.split('@')[0];
      body.name = derived && derived.length > 0 ? derived : 'User';
    }),
  },
  advanced: {
    cookiePrefix: 'better-auth',
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    },
    cookies: {
      sessionToken: {
        attributes: {
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  user: {
    additionalFields: {
      image: {
        type: 'string',
        required: false,
      },
    },
  },
  // Enable Authorization: Bearer <session-token> so mobile apps (which can't
  // carry cookies through a WebView) authenticate API calls with the token
  // returned from /api/auth/token.
  plugins: [bearer()],
});

export type Session = typeof auth.$Infer.Session;