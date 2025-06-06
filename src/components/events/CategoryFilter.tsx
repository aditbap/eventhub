
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Music2, Utensils, Activity, Laptop, LayoutGrid, type LucideIcon } from 'lucide-react'; // Added LayoutGrid
import type { Event } from '@/types';

interface CategoryInfo {
  name: Event['category'] | 'All'; // Allow 'All'
  label: string;
  icon: LucideIcon;
  activeClassName: string;
  inactiveClassName: string;
}

const categoriesData: CategoryInfo[] = [
  { name: 'All', label: 'All', icon: LayoutGrid, activeClassName: 'bg-primary text-primary-foreground hover:bg-primary/90', inactiveClassName: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
  { name: 'Music', label: 'Music', icon: Music2, activeClassName: 'bg-category-music text-white hover:bg-category-music/90', inactiveClassName: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
  { name: 'Food', label: 'Food', icon: Utensils, activeClassName: 'bg-category-food text-white hover:bg-category-food/90', inactiveClassName: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
  { name: 'Sports', label: 'Sports', icon: Activity, activeClassName: 'bg-category-sports text-white hover:bg-category-sports/90', inactiveClassName: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
  { name: 'Tech', label: 'Tech', icon: Laptop, activeClassName: 'bg-category-tech text-white hover:bg-category-tech/90', inactiveClassName: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
];

interface CategoryFilterProps {
  onSelectCategory: (category: Event['category'] | 'All') => void; // Updated type
  currentCategory: Event['category'] | 'All'; // Updated type
}

export function CategoryFilter({ onSelectCategory, currentCategory }: CategoryFilterProps) {
  return (
    <div className="py-4 overflow-x-auto">
      <div className="flex space-x-3">
        {categoriesData.map((category) => (
          <Button
            key={category.name}
            variant="outline"
            size="default"
            onClick={() => onSelectCategory(category.name)}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 h-12 min-w-[100px] justify-center shadow-sm",
              currentCategory === category.name
                ? category.activeClassName
                : category.inactiveClassName
            )}
          >
            <category.icon className="h-5 w-5" />
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
