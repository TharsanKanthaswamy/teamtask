'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  Settings,
  LogOut,
  Folder,
  Layers,
  Plus,
  Search,
  User,
  Shield,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { UserProfileDialog } from '@/components/members/user-profile-dialog';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch current user session
  const { data: authData } = useQuery<any>({
    queryKey: ['auth-verify'],
    queryFn: () => api.auth.verify(),
  });

  const currentUser = authData?.user;
  const userName = currentUser?.name || 'Super Administrator';
  const userEmail = currentUser?.email || 'admin@teamtrack.local';

  const handleSignOut = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error(e);
    } finally {
      router.push('/login');
    }
  };

  const getBreadcrumbTitle = () => {
    if (pathname.includes('/admin/teams')) return 'Teams';
    if (pathname.includes('/admin/projects')) return 'Projects';
    if (pathname.includes('/admin/members')) return 'Members';
    if (pathname.includes('/admin/activity')) return 'Activity & Audit';
    if (pathname.includes('/admin/settings')) return 'Settings';
    return 'Overview';
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-border bg-card transition-all duration-300 ease-in-out md:static ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-72 shrink-0`}
      >
        <div>
          {/* Sidebar Header */}
          <div
            className={`flex h-16 items-center border-b border-border px-4 ${
              isCollapsed ? 'md:justify-center' : 'justify-between'
            }`}
          >
            <Link
              href="/admin/dashboard"
              className={`items-center gap-2.5 group ${isCollapsed ? 'md:hidden flex' : 'flex'}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold group-hover:scale-105 transition-transform shrink-0">
                TT
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate">TeamTrack</h1>
              <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary tracking-wide uppercase shrink-0">
                Admin
              </span>
            </Link>

            {/* Collapsed desktop logo */}
            {isCollapsed && (
              <Link
                href="/admin/dashboard"
                className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg bg-primary/20 text-primary font-bold hover:scale-105 transition-transform"
                title="TeamTrack Admin"
              >
                TT
              </Link>
            )}

            {/* Close button for mobile drawer */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5 p-3">
            <NavLink href="/admin/dashboard" icon={<LayoutDashboard size={18} />} collapsed={isCollapsed}>
              Overview
            </NavLink>
            <NavLink href="/admin/teams" icon={<Building2 size={18} />} collapsed={isCollapsed}>
              Teams
            </NavLink>
            <NavLink href="/admin/projects" icon={<Folder size={18} />} collapsed={isCollapsed}>
              Projects
            </NavLink>
            <NavLink href="/admin/members" icon={<Users size={18} />} collapsed={isCollapsed}>
              Members
            </NavLink>
            <NavLink href="/admin/activity" icon={<Activity size={18} />} collapsed={isCollapsed}>
              Activity
            </NavLink>
            <NavLink href="/admin/settings" icon={<Settings size={18} />} collapsed={isCollapsed}>
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="border-t border-border p-3 space-y-2">
          {/* Quick Profile Summary in sidebar */}
          <button
            onClick={() => setIsMyProfileOpen(true)}
            className={`flex w-full items-center rounded-lg p-2 text-left hover:bg-accent/60 transition-colors group ${
              isCollapsed ? 'md:justify-center' : 'gap-3'
            }`}
            title={`Profile: ${userName} (${userEmail})`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {userName}
              </div>
              <div className="text-[11px] text-muted-foreground truncate font-mono">
                {userEmail}
              </div>
            </div>
          </button>

          <Link
            href="/workspace/projects"
            className={`flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
              isCollapsed ? 'md:justify-center md:px-0' : 'gap-2.5'
            }`}
            title="Switch to Workspace"
          >
            <Layers size={16} className="shrink-0" />
            <span className={isCollapsed ? 'md:hidden truncate' : 'truncate'}>Switch to Workspace</span>
          </Link>

          <button
            onClick={handleSignOut}
            className={`button-press flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors ${
              isCollapsed ? 'md:justify-center md:px-0' : 'gap-2.5'
            }`}
            title="Sign out"
          >
            <LogOut size={16} className="shrink-0" />
            <span className={isCollapsed ? 'md:hidden truncate' : 'truncate'}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
          {/* Left: Mobile Hamburger, Desktop Collapse Toggle, Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Admin</span>
            <span className="text-muted-foreground/40 text-xs hidden sm:inline">/</span>
            <span className="text-sm font-semibold text-foreground truncate">{getBreadcrumbTitle()}</span>
          </div>

          {/* Right: Actions, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Create Dropdown */}
            <div className="relative" ref={quickCreateRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                className="gap-1.5 text-xs font-medium h-9 px-3"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Create</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

              {isQuickCreateOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover shadow-xl p-1.5 z-50 animate-fade-in text-xs">
                  <Link
                    href="/admin/teams"
                    onClick={() => setIsQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                  >
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>New Team</span>
                  </Link>
                  <Link
                    href="/admin/projects"
                    onClick={() => setIsQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                  >
                    <Folder className="h-3.5 w-3.5 text-primary" />
                    <span>New Project</span>
                  </Link>
                  <Link
                    href="/admin/members"
                    onClick={() => setIsQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                  >
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>Add Member</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Profile Avatar & Menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-accent/60 transition-colors group"
                title="Account menu"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-xs border border-primary/30 group-hover:scale-105 transition-transform">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <ShieldAlert className="h-2.5 w-2.5" />
                    Platform Admin
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-popover shadow-2xl p-2 z-50 animate-fade-in">
                  {/* Menu User Header */}
                  <div className="p-3 border-b border-border/50 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm text-foreground truncate">
                        {userName}
                      </div>
                      <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold shrink-0">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {userEmail}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1.5 space-y-0.5 text-xs">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsMyProfileOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground font-medium text-left transition-colors"
                    >
                      <User className="h-4 w-4 text-primary" />
                      <span>View My Profile</span>
                    </button>

                    <Link
                      href="/admin/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground font-medium transition-colors"
                    >
                      <Settings className="h-4 w-4 text-primary" />
                      <span>Platform Settings</span>
                    </Link>

                    <Link
                      href="/admin/activity"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground font-medium transition-colors"
                    >
                      <Activity className="h-4 w-4 text-primary" />
                      <span>Activity & Logs</span>
                    </Link>

                    <Link
                      href="/workspace/projects"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground font-medium transition-colors"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Switch to Workspace</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1.5 border-t border-border/50">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-medium text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Admin User Profile Dialog */}
      {isMyProfileOpen && currentUser && (
        <UserProfileDialog
          isOpen={isMyProfileOpen}
          onClose={() => setIsMyProfileOpen(false)}
          userId={currentUser.userId}
          fallbackName={userName}
          fallbackEmail={userEmail}
          fallbackRole="SUPER_ADMIN"
        />
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
  collapsed,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      title={typeof children === 'string' ? children : undefined}
      className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
        collapsed ? 'md:justify-center md:px-2 px-3 gap-3' : 'gap-3 px-3'
      } ${
        isActive
          ? 'bg-primary/15 text-primary font-semibold shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className={collapsed ? 'md:hidden truncate' : 'truncate'}>{children}</span>
    </Link>
  );
}
