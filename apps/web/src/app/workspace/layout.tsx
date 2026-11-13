'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Shield,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const { data: authData } = useQuery<any>({
    queryKey: ['auth-verify'],
    queryFn: () => api.auth.verify(),
  });

  const currentUser = authData?.user;
  const isAdmin = currentUser?.isAdmin;
  const userName = currentUser?.name || 'Team Member';
  const userEmail = currentUser?.email || '';

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
    if (pathname.includes('/workspace/projects')) return 'Projects';
    if (pathname.includes('/workspace/tasks')) return 'Tasks';
    if (pathname.includes('/workspace/members')) return 'Team Members';
    if (pathname.includes('/workspace/analytics')) return 'Analytics';
    return 'Dashboard';
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
              href="/workspace/dashboard"
              className={`items-center gap-2.5 group ${isCollapsed ? 'md:hidden flex' : 'flex'}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold group-hover:scale-105 transition-transform shrink-0">
                TT
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate">TeamTrack</h1>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                Workspace
              </span>
            </Link>

            {/* Collapsed desktop logo */}
            {isCollapsed && (
              <Link
                href="/workspace/dashboard"
                className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg bg-primary/20 text-primary font-bold hover:scale-105 transition-transform"
                title="TeamTrack Workspace"
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

          <nav className="flex flex-col gap-1 p-3">
            <NavLink href="/workspace/dashboard" icon={<LayoutDashboard size={18} />} collapsed={isCollapsed}>
              Dashboard
            </NavLink>
            <NavLink href="/workspace/projects" icon={<FolderKanban size={18} />} collapsed={isCollapsed}>
              Projects
            </NavLink>
            <NavLink href="/workspace/tasks" icon={<CheckSquare size={18} />} collapsed={isCollapsed}>
              Tasks
            </NavLink>
            <NavLink href="/workspace/members" icon={<Users size={18} />} collapsed={isCollapsed}>
              Team Members
            </NavLink>
            <NavLink href="/workspace/analytics" icon={<BarChart3 size={18} />} collapsed={isCollapsed}>
              Analytics
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3 space-y-2">
          {/* User profile brief */}
          <div
            className={`flex items-center rounded-lg p-2 ${
              isCollapsed ? 'md:justify-center' : 'gap-3'
            }`}
            title={`${userName} (${userEmail})`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-foreground truncate">{userName}</div>
              <div className="text-[11px] text-muted-foreground truncate font-mono">{userEmail}</div>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors ${
                isCollapsed ? 'md:justify-center md:px-0' : 'gap-2.5'
              }`}
              title="Admin Console"
            >
              <Shield size={16} className="shrink-0" />
              <span className={isCollapsed ? 'md:hidden truncate' : 'truncate'}>Admin Console</span>
            </Link>
          )}

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

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Button */}
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

            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Workspace</span>
            <span className="text-muted-foreground/40 text-xs hidden sm:inline">/</span>
            <span className="text-sm font-semibold text-foreground truncate">{getBreadcrumbTitle()}</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
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
    pathname === href || (href !== '/workspace/dashboard' && pathname.startsWith(href));

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
