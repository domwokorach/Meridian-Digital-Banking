import { Link } from 'react-router-dom';
import { Bell, CircleCheck, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '../../context/NotificationContext';
import { dateLabel } from '../../lib/format';
import type { AppNotification } from '../../lib/types';
export const kindIcon = (k: AppNotification['kind']) => k === 'security' ? ShieldAlert : k === 'activity' ? CircleCheck : Info;
export default function NotificationsPopover() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  return <Popover>
    <PopoverTrigger render={<Button variant="ghost" size="icon-lg" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative"/>}>
      <Bell className="size-5"/>
      {unread > 0 && <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-background" aria-hidden="true">{unread}</span>}
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[22rem] rounded-2xl p-0">
      <div className="flex items-center justify-between px-4 py-3"><h2 className="text-sm font-semibold">Notifications</h2><Button variant="ghost" size="sm" onClick={markAllRead} disabled={!unread}>Mark all read</Button></div>
      <ul className="max-h-80 divide-y divide-border overflow-y-auto border-t border-border">
        <AnimatePresence initial={false}>{items.slice(0, 4).map(n => { const Icon = kindIcon(n.kind); return <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
          <button type="button" onClick={() => markRead(n.id)} className="flex w-full gap-3 px-4 py-3 text-left outline-none hover:bg-muted focus-visible:bg-muted">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-4"/></span>
            <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <span className="size-2 rounded-full bg-primary" aria-label="Unread"/>}</span><span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span><span className="text-[11px] text-muted-foreground">{dateLabel(n.createdAt)}</span></span>
          </button></motion.li>; })}</AnimatePresence>
      </ul>
      <div className="border-t border-border p-2"><Link to="/app/notifications" className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted">View all notifications</Link><p className="px-3 pb-1 text-center text-[11px] text-muted-foreground">Demo notifications</p></div>
    </PopoverContent>
  </Popover>;
}
