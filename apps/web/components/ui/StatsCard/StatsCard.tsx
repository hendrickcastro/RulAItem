import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
  onClick?: () => void;
}

const variantClasses = {
  default: 'from-gray-50 to-gray-100 border-gray-200',
  primary: 'from-blue-50 to-blue-100 border-blue-200',
  success: 'from-green-50 to-green-100 border-green-200',
  warning: 'from-yellow-50 to-yellow-100 border-yellow-200',
  danger: 'from-red-50 to-red-100 border-red-200',
};

const iconBgClasses = {
  default: 'bg-gray-500',
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const textClasses = {
  default: 'text-gray-900',
  primary: 'text-blue-900',
  success: 'text-green-900',
  warning: 'text-yellow-900',
  danger: 'text-red-900',
};

const valueClasses = {
  default: 'text-gray-700',
  primary: 'text-blue-700',
  success: 'text-green-700',
  warning: 'text-yellow-700',
  danger: 'text-red-700',
};

const descClasses = {
  default: 'text-gray-600',
  primary: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  variant = 'default',
  isLoading = false,
  onClick,
}: StatsCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-gradient-to-br border p-4 lg:p-6 rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all',
        variantClasses[variant],
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-sm lg:text-lg font-semibold', textClasses[variant])}>
          {title}
        </h3>
        {icon && (
          <div className={cn('p-1.5 lg:p-2 rounded-lg', iconBgClasses[variant])}>
            <div className="w-4 h-4 lg:w-5 lg:h-5 text-white">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className={cn('text-2xl lg:text-3xl font-bold', valueClasses[variant])}>
          {isLoading ? '...' : value}
        </p>
        
        {description && (
          <p className={cn('text-xs lg:text-sm font-medium', descClasses[variant])}>
            {description}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500">vs último período</span>
          </div>
        )}
      </div>
    </Component>
  );
}