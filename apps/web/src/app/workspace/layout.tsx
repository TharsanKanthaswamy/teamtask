'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, LogOut } from 'lucide-react';
import { api } from '@/lib/api';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error(e);
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card relative flex flex-col justify-between">
        <div>
          <div className="flex h-16 items-center border-b border-border px-6">
            <h1 className="text-lg font-semibold">TeamTrack</h1>
            <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Workspace
            </span>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            <NavLink href="/workspace/dashboard" icon={<LayoutDashboard size={18} />}>
              Dashboard
            </NavLink>
            <NavLink href="/workspace/projects" icon={<FolderKanban size={18} />}>
              Projects
            </NavLink>
            <NavLink href="/workspace/tasks" icon={<CheckSquare size={18} />}>
              Tasks
            </NavLink>
            <NavLink href="/workspace/members" icon={<Users size={18} />}>
              Team Members
            </NavLink>
            <NavLink href="/workspace/analytics" icon={<BarChart3 size={18} />}>
              Analytics
            </NavLink>
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
