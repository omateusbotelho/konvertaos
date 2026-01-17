import { ReactNode, useState, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: ReactNode;
  itemIds: string[];
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

function KanbanColumnComponent({
  id,
  title,
  count,
  color,
  children,
  itemIds,
  isCollapsible = false,
  defaultCollapsed = false,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { isOver, setNodeRef } = useDroppable({ id });

  if (isCollapsible && isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        className="flex-shrink-0 w-[280px] lg:w-[300px]"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(
            "w-full flex items-center gap-2 p-3 rounded-lg bg-card border border-border/20 hover:bg-card/80 transition-colors",
            isOver && "ring-2 ring-primary"
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
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[280px] lg:w-[300px] flex flex-col bg-card/50 rounded-lg border border-border/20 max-h-[calc(100vh-280px)]",
        isOver && "ring-2 ring-primary bg-primary/5"
      )}
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
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 min-h-[100px]">
            {children}
            {isOver && (
              <div className="h-[120px] border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Soltar aqui
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

// Memoize column - re-render only when count or itemIds change
export const KanbanColumn = memo(KanbanColumnComponent, (prevProps, nextProps) => {
  // Check if itemIds array is the same
  const sameItemIds = 
    prevProps.itemIds.length === nextProps.itemIds.length &&
    prevProps.itemIds.every((id, idx) => id === nextProps.itemIds[idx]);

  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.count === nextProps.count &&
    prevProps.color === nextProps.color &&
    prevProps.isCollapsible === nextProps.isCollapsible &&
    prevProps.defaultCollapsed === nextProps.defaultCollapsed &&
    sameItemIds
  );
});
