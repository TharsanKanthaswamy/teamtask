'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

        {/* Premium glass login card */}
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

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3.5 backdrop-blur-sm animate-fade-in">
                  <p className="text-sm font-medium text-destructive">{error}</p>
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
            </form>
          </div>
        </GlassCard>

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
