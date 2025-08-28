'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const pageTitles: Record<string, string> = {
  '': 'Inicio',
  'dashboard': 'Dashboard',
  'commits': 'Commits',
  'contextos': 'Contextos',
  'analysis': 'Análisis',
  'jobs': 'Trabajos'
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Split pathname and filter empty strings
  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Add home/dashboard
  breadcrumbs.push({
    label: 'Inicio',
    href: '/dashboard'
  });
  
  // Add intermediate segments
  let currentPath = '';
  for (const segment of segments) {
    if (segment === 'dashboard') continue; // Skip dashboard as it's already added as "Inicio"
    
    currentPath += `/${segment}`;
    const label = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      href: currentPath
    });
  }

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if we're on home/dashboard only
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index === 0 && (
              <HomeIcon className="h-4 w-4 text-gray-400 mr-2" />
            )}
            
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            {index === breadcrumbs.length - 1 ? (
              // Current page - not clickable
              <span className="text-gray-600 font-medium">
                {breadcrumb.label}
              </span>
            ) : (
              // Previous pages - clickable
              <Link
                href={breadcrumb.href}
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}