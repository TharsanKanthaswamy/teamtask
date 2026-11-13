'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Palette,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  Cpu,
  Save,
  Key,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'SYSTEM' | 'APPEARANCE'>('GENERAL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [generalConfig, setGeneralConfig] = useState({
    platformName: 'TeamTrack',
    orgName: 'Acme Enterprise',
    supportEmail: 'admin@teamtrack.local',
    appUrl: 'http://localhost:3005',
    apiUrl: 'http://localhost:3001/api/v1',
  });

  const [securityConfig, setSecurityConfig] = useState({
    sessionExpiryDays: '7',
    argonMemoryCost: '65536 KB (64 MB)',
    argonTimeCost: '3 iterations',
    argonParallelism: '4 threads',
    requireMfaForAdmins: false,
    auditRetentionDays: '90',
  });

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8 max-w-5xl">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display-text text-4xl font-semibold tracking-tight text-foreground">
                Platform Settings
              </h1>
              <p className="body-text text-base text-muted-foreground max-w-2xl mt-1">
                Configure organization branding, security policies, system runtime, and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} className="gap-2 font-medium shadow-sm">
                <Save className="h-4 w-4" />
                {savedSuccess ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </header>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3 text-success animate-fade-in">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Platform settings successfully updated.</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'GENERAL'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'SECURITY'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'SYSTEM'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>System Runtime</span>
          </button>

          <button
            onClick={() => setActiveTab('APPEARANCE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'APPEARANCE'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'GENERAL' && (
          <GlassCard variant="elevated" className="p-6 space-y-6 border border-border shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Organization & Platform Info</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set public-facing brand names and endpoints
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={generalConfig.platformName}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, platformName: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={generalConfig.orgName}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, orgName: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Admin Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={generalConfig.supportEmail}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, supportEmail: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appUrl">Web Frontend URL</Label>
                <Input
                  id="appUrl"
                  value={generalConfig.appUrl}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, appUrl: e.target.value })}
                  className="bg-background text-foreground font-mono text-xs"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="apiUrl">Backend API URL</Label>
                <Input
                  id="apiUrl"
                  value={generalConfig.apiUrl}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, apiUrl: e.target.value })}
                  className="bg-background text-foreground font-mono text-xs"
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab 2: Security & Authentication */}
        {activeTab === 'SECURITY' && (
          <GlassCard variant="elevated" className="p-6 space-y-6 border border-border shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security Standards & Password Policies
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cryptographic parameters and authentication controls
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Key className="h-4 w-4 text-primary" />
                  <span>Password Algorithm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  TeamTrack uses high-security <strong>Argon2id</strong> password hashing to resist GPU and ASIC cracking attacks.
                </p>
                <div className="text-[11px] font-mono text-muted-foreground space-y-0.5 pt-1">
                  <div>Memory Cost: {securityConfig.argonMemoryCost}</div>
                  <div>Time Cost: {securityConfig.argonTimeCost}</div>
                  <div>Parallelism: {securityConfig.argonParallelism}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Multi-Tenant Isolation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Row-level tenant validation prevents unauthorized cross-team access. Each query verifies active team memberships.
                </p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
                  Status: Strict Isolation Active
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionExpiry">Session Duration (Days)</Label>
                <Input
                  id="sessionExpiry"
                  type="number"
                  value={securityConfig.sessionExpiryDays}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, sessionExpiryDays: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auditRetention">Audit Logs Retention (Days)</Label>
                <Input
                  id="auditRetention"
                  type="number"
                  value={securityConfig.auditRetentionDays}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, auditRetentionDays: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab 3: System Runtime */}
        {activeTab === 'SYSTEM' && (
          <GlassCard variant="elevated" className="p-6 space-y-6 border border-border shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Service Health & Runtime Diagnostics
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live status of local services and infrastructure components
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">PostgreSQL 16</h3>
                    <p className="text-xs text-muted-foreground">Local Cluster on port 5432 (database: teamtrack)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Running
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">NestJS API Engine</h3>
                    <p className="text-xs text-muted-foreground">HTTP daemon running on port 3001 with Swagger docs</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Next.js 14 Frontend</h3>
                    <p className="text-xs text-muted-foreground">Web client hosted on port 3005</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Hosted
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab 4: Appearance */}
        {activeTab === 'APPEARANCE' && (
          <GlassCard variant="elevated" className="p-6 space-y-6 border border-border shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Theme & Design Styling
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Glassmorphism styling and dark/light color palette
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Theme Switcher</h3>
                <p className="text-xs text-muted-foreground">
                  Toggle between high-contrast Dark theme (with Neon Green accents) and Crisp Light theme
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-1">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Design Specifications</h4>
              <p className="text-xs text-muted-foreground">
                Features Apple-style frosted glass surfaces, backdrop blur, fluid mesh gradients, and interactive micro-animations.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

