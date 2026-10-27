import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'blue';
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet';
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-100',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700',
  },
  rose: {
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    border: 'border-rose-100',
    badge: 'bg-rose-100 text-rose-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-100',
    badge: 'bg-cyan-100 text-cyan-700',
  },
  violet: {
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    border: 'border-violet-100',
    badge: 'bg-violet-100 text-violet-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
  color = 'indigo',
}) => {
  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`bg-white rounded-2xl p-5 border ${scheme.border} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            {badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${scheme.badge}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg} ${scheme.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
