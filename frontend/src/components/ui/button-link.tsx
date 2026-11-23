import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import type { VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
/** A real <a> (role "link") styled as a button, so assistive tech announces navigation rather than an action. */
export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}/>;
}
