import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function LanguageSelector({ currentLang, onLanguageChange, theme }) {
  const currentLanguage = LANGUAGES.find(l => l.code === currentLang);
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-sm font-medium transition-colors",
            theme.button
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLanguage?.flag}</span>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "min-w-[120px] rounded-md border p-1 shadow-md z-50",
            theme.dropdown
          )}
          sideOffset={5}
        >
          {LANGUAGES.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none",
                theme.dropdownItem,
                currentLang === lang.code && theme.dropdownItemActive
              )}
              onSelect={() => onLanguageChange(lang.code)}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
