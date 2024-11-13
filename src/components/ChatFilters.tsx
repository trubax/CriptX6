import React from 'react';
import { MessageCircle, Users, Briefcase } from 'lucide-react';

type ChatFilter = 'all' | 'direct' | 'groups' | 'business';

interface ChatFiltersProps {
  activeFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  counts: {
    all: number;
    direct: number;
    groups: number;
    business: number;
  };
}

export default function ChatFilters({ activeFilter, onFilterChange, counts }: ChatFiltersProps) {
  const filters: { id: ChatFilter; label: string; icon: typeof MessageCircle }[] = [
    { id: 'all', label: 'Tutte', icon: MessageCircle },
    { id: 'direct', label: 'Chat dirette', icon: MessageCircle },
    { id: 'groups', label: 'Gruppi', icon: Users },
    { id: 'business', label: 'Servizi', icon: Briefcase }
  ];

  const getCounterColor = (count: number) => {
    if (count === 0) return 'inherit';
    return 'text-green-500';
  };

  return (
    <div className="sticky top-0 z-10 theme-bg border-b theme-divide">
      <div className="relative w-full">
        <div className="flex w-full">
          {filters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onFilterChange(id)}
              className={`
                flex-1 transition-all duration-200
                ${activeFilter === id 
                  ? 'theme-bg-accent theme-text scale-105 z-10' 
                  : 'theme-bg-secondary theme-text opacity-40'
                }
                flex flex-col items-center justify-center py-1.5
                md:py-2 md:px-4
                md:flex md:flex-col md:items-center
              `}
            >
              <div className="
                flex flex-col items-center gap-0.5
                md:flex-row md:gap-3 md:w-full md:justify-center
              ">
                <Icon className="
                  w-3.5 h-3.5
                  md:w-5 md:h-5
                " />
                <span className="
                  text-[11.5px] font-medium whitespace-nowrap
                  md:text-[15px]
                ">
                  {label}
                </span>
              </div>

              {/* Contatore messaggi aggiornato */}
              <span className={`
                text-[10.5px] mt-0.5 font-medium
                md:text-[15px] md:mt-1
                ${getCounterColor(counts[id])}
                ${activeFilter === id ? '' : 'opacity-90'}
              `}>
                ({counts[id]})
              </span>
            </button>
          ))}
        </div>

        {/* Indicatore di selezione */}
        <div 
          className="absolute bottom-0 h-0.5 bg-accent transition-all duration-200"
          style={{
            width: '25%',
            left: `${filters.findIndex(f => f.id === activeFilter) * 25}%`
          }}
        />
      </div>
    </div>
  );
}