'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categories = ['All', 'Music', 'Food', 'Sports', 'Other'];

const categoryColors: Record<string, string> = {
  Music: 'border-category-music text-category-music hover:bg-category-music/10',
  Food: 'border-category-food text-category-food hover:bg-category-food/10',
  Sports: 'border-category-sports text-category-sports hover:bg-category-sports/10',
  Other: 'border-gray-500 text-gray-500 hover:bg-gray-500/10',
  All: 'border-primary text-primary hover:bg-primary/10',
};

const activeCategoryColors: Record<string, string> = {
 Music: 'bg-category-music text-white',
 Food: 'bg-category-food text-white',
 Sports: 'bg-category-sports text-white',
 Other: 'bg-gray-500 text-white',
 All: 'bg-primary text-primary-foreground',
};


interface CategoryFilterProps {
  onSelectCategory: (category: string) => void;
  currentCategory: string;
}

export function CategoryFilter({ onSelectCategory, currentCategory }: CategoryFilterProps) {
  return (
    <div className="py-4 overflow-x-auto">
      <div className="flex space-x-3">
        {categories.map((category) => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            onClick={() => onSelectCategory(category)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
              currentCategory === category
                ? activeCategoryColors[category] || activeCategoryColors['All']
                : categoryColors[category] || categoryColors['All']
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
