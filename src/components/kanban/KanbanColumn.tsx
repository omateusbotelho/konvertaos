import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  children: ReactNode;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onDrop?: (leadId: string) => void;
}

export function KanbanColumn({
  title,
  count,
  color,
  children,
  isCollapsible = false,
  defaultCollapsed = false,
  onDrop,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId && onDrop) {
      onDrop(leadId);
    }
  };

  if (isCollapsible && isCollapsed) {
    return (
      <div
        className="flex-shrink-0 w-[280px] lg:w-[300px]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(
            "w-full flex items-center gap-2 p-3 rounded-lg bg-card border border-border/20 hover:bg-card/80 transition-colors",
            isDragOver && "ring-2 ring-primary"
          )}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">({count})</span>
          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[280px] lg:w-[300px] flex flex-col bg-card/50 rounded-lg border border-border/20 max-h-[calc(100vh-280px)]",
        isDragOver && "ring-2 ring-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/20">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-foreground flex-1">{title}</span>
        <span className="text-sm text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
          {count}
        </span>
        {isCollapsible && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-background/50 rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2 min-h-[100px]">
          {children}
          {isDragOver && (
            <div className="h-[120px] border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
              Soltar aqui
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
