import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Brand({ to = '/', className, compact = false }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sprout className="h-4 w-4" strokeWidth={1.9} />
      </span>
      {!compact &&
      <span className="font-heading text-xl leading-none tracking-tight">
          Komer<span className="text-accent">ci</span>
        </span>
      }
    </Link>);

}