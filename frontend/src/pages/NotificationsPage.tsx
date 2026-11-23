import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { kindIcon } from '../components/layout/NotificationsPopover';
import { useNotifications } from '../context/NotificationContext';
import { dateLabel } from '../lib/format';
import type { AppNotification } from '../lib/types';
function List({ items, onRead }: { items: AppNotification[]; onRead: (id: string) => void }) {
  if (!items.length) return <Empty className="py-12"><EmptyHeader><EmptyMedia variant="icon"><Bell/></EmptyMedia><EmptyTitle>You're all caught up</EmptyTitle><EmptyDescription>New alerts will appear here.</EmptyDescription></EmptyHeader></Empty>;
  return <ul className="divide-y divide-border rounded-3xl border border-border bg-card">{items.map(n => { const Icon = kindIcon(n.kind); return <li key={n.id} className="flex items-start gap-3 p-4">
    <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', n.kind === 'security' ? 'bg-warning/15 text-warning' : 'bg-secondary text-primary')}><Icon className="size-4"/></span>
    <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <Badge>Unread</Badge>}</p><p className="text-sm text-muted-foreground">{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(n.createdAt)}</p></div>
    {!n.read && <Button variant="ghost" size="sm" onClick={() => onRead(n.id)}>Mark read</Button>}</li>; })}</ul>;
}
export default function NotificationsPage() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  return <div className="space-y-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Activity &amp; alerts</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Notifications</h1></div><Button variant="outline" className="h-10 rounded-full px-4" disabled={!unread} onClick={markAllRead}>Mark all read</Button></div>
    <Badge variant="outline" className="border-warning/50 text-warning">Demo notifications</Badge>
    <Tabs defaultValue="all"><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="unread">Unread ({unread})</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
      <TabsContent value="all" className="mt-4"><List items={items} onRead={markRead}/></TabsContent>
      <TabsContent value="unread" className="mt-4"><List items={items.filter(n => !n.read)} onRead={markRead}/></TabsContent>
      <TabsContent value="security" className="mt-4"><List items={items.filter(n => n.kind === 'security')} onRead={markRead}/></TabsContent></Tabs></div>;
}
