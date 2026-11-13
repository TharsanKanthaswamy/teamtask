'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Users } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const displayError = error || urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result: any = await api.auth.login(email, password);

      if (result.success) {
        router.push(result.redirectTo);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard variant="elevated" className="overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-11 rounded-lg bg-background-elevated border-border/50 backdrop-blur-sm transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg bg-background-elevated border-border/50 backdrop-blur-sm transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {displayError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3.5 backdrop-blur-sm animate-fade-in">
              <p className="text-sm font-medium text-destructive">{displayError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="button-press h-11 w-full rounded-lg bg-primary text-primary-foreground text-base font-semibold shadow-ambient transition-all duration-200 hover:bg-primary/90 hover:shadow-ambient-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background-elevated px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/google`;
            }}
            className="h-11 w-full rounded-lg border-border/50 bg-background-elevated hover:bg-muted/50 font-medium flex items-center justify-center gap-3 transition-all duration-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>
        </form>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Sophisticated ambient gradient background */}
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-50" />

      {/* Subtle floating orbs for depth */}
      <div className="fixed top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="fixed bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Premium brand logo */}
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl glass-elevated shadow-ambient-lg">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="display-text text-4xl font-semibold tracking-tight">
              TeamTrack
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Project Workforce Management
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        {/* Development credentials */}
        <GlassCard variant="subtle" className="mt-6">
          <div className="p-4 text-center space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Development Access
            </p>
            <div className="space-y-1 text-xs text-muted-foreground tabular-nums">
              <p>
                <span className="font-semibold text-foreground">Super Admin:</span>{' '}
                admin@teamtrack.local / Admin@123
              </p>
              <p>
                <span className="font-semibold text-foreground">Team Lead:</span>{' '}
                alice@teamtrack.local / Password@123
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}
