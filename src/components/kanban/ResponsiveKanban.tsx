import { ReactNode, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  label: string;
  color: string;
  count: number;
  content: ReactNode;
}

interface ResponsiveKanbanProps {
  columns: Column[];
  children?: ReactNode;
}

export function ResponsiveKanban({ columns }: ResponsiveKanbanProps) {
  const isMobile = useIsMobile();
  const [selectedColumn, setSelectedColumn] = useState(columns[0]?.id || "");

  if (!isMobile) {
    // Desktop: show all columns side by side with horizontal scroll
    return (
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex-shrink-0">
              {column.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile: show tabs or select for column switching
  const currentColumn = columns.find((c) => c.id === selectedColumn);

  return (
    <div className="flex-1 flex flex-col">
      {/* Mobile column selector */}
      <div className="mb-4">
        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {currentColumn && (
                <>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentColumn.color }}
                  />
                  <span>{currentColumn.label}</span>
                  <span className="text-muted-foreground">
                    ({currentColumn.count})
                  </span>
                </>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {columns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.label}</span>
                  <span className="text-muted-foreground ml-1">
                    ({column.count})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile column content */}
      <div className="flex-1 overflow-y-auto">
        {currentColumn?.content}
      </div>

      {/* Mobile quick navigation tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/20 p-2 flex gap-1 overflow-x-auto lg:hidden">
        {columns.map((column) => (
          <button
            key={column.id}
            onClick={() => setSelectedColumn(column.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors",
              selectedColumn === column.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <span>{column.label}</span>
            <span className="text-[10px] opacity-70">{column.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hook to use in pages that need to know if they should render mobile-friendly content
export function useResponsiveKanban() {
  const isMobile = useIsMobile();
  return { isMobile };
}
