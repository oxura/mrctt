import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '../../types';
import { useAppStore } from '../../store/appStore';

interface LeadKanbanProps {
  leads: Lead[];
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  leads: Lead[];
}

export default function LeadKanban({ leads }: LeadKanbanProps) {
  const { company, products, groups, updateLead, addLeadHistory, user } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const leadMap = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  const columns: KanbanColumn[] = useMemo(() => {
    return (
      company?.leadStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        leads: leads
          .filter((lead) => lead.statusId === status.id)
          .sort((a, b) => a.kanbanOrder - b.kanbanOrder),
      })) || []
    );
  }, [company?.leadStatuses, leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    if (activeLeadId === overId) {
      setActiveId(null);
      return;
    }

    const activeLead = leadMap.get(activeLeadId);
    if (!activeLead) {
      setActiveId(null);
      return;
    }

    const sourceColumn = columns.find((column) => column.id === activeLead.statusId);
    if (!sourceColumn) {
      setActiveId(null);
      return;
    }

    const overData = over.data?.current as { type?: 'lead' | 'column'; columnId?: string } | undefined;

    let destinationColumnId: string | undefined;
    if (overData?.type === 'column') {
      destinationColumnId = overId;
    } else if (overData?.type === 'lead') {
      destinationColumnId = overData.columnId;
    } else {
      const overLead = leadMap.get(overId);
      destinationColumnId = overLead?.statusId;
    }

    if (!destinationColumnId) {
      setActiveId(null);
      return;
    }

    const destinationColumn = columns.find((column) => column.id === destinationColumnId);
    if (!destinationColumn) {
      setActiveId(null);
      return;
    }

    const sourceIndex = sourceColumn.leads.findIndex((lead) => lead.id === activeLeadId);
    if (sourceIndex === -1) {
      setActiveId(null);
      return;
    }

    let destinationIndex: number;
    if (overData?.type === 'lead') {
      destinationIndex = destinationColumn.leads.findIndex((lead) => lead.id === overId);
      if (destinationIndex === -1) {
        destinationIndex = destinationColumn.leads.length;
      }
    } else {
      destinationIndex = destinationColumn.leads.length;
    }

    if (sourceColumn.id === destinationColumn.id) {
      const reordered = arrayMove(sourceColumn.leads, sourceIndex, destinationIndex);
      reordered.forEach((lead, index) => {
        if (lead.kanbanOrder !== index) {
          updateLead(lead.id, { kanbanOrder: index });
        }
      });
      setActiveId(null);
      return;
    }

    const updatedSource = sourceColumn.leads.filter((lead) => lead.id !== activeLeadId);
    updatedSource.forEach((lead, index) => {
      if (lead.kanbanOrder !== index) {
        updateLead(lead.id, { kanbanOrder: index });
      }
    });

    const destinationLeads = [...destinationColumn.leads];
    destinationLeads.splice(destinationIndex, 0, { ...activeLead, statusId: destinationColumn.id });

    destinationLeads.forEach((lead, index) => {
      if (lead.id === activeLeadId) {
        updateLead(lead.id, { statusId: destinationColumn.id, kanbanOrder: index });
      } else if (lead.kanbanOrder !== index) {
        updateLead(lead.id, { kanbanOrder: index });
      }
    });

    const oldStatus = company?.leadStatuses.find((status) => status.id === sourceColumn.id);
    const newStatus = company?.leadStatuses.find((status) => status.id === destinationColumn.id);

    if (oldStatus && newStatus && oldStatus.id !== newStatus.id) {
      addLeadHistory(activeLeadId, {
        id: `history-${Date.now()}`,
        type: 'status_change',
        message: `Статус изменен: ${oldStatus.name} → ${newStatus.name}`,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || 'system',
      });
    }

    setActiveId(null);
  };

  const getProductName = (productId?: string) =>
    products.find((product) => product.id === productId)?.name;

  const getGroupName = (groupId?: string) =>
    groups.find((group) => group.id === groupId)?.name;

  const activeLead = activeId ? leadMap.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-4 grid gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            getProductName={getProductName}
            getGroupName={getGroupName}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <LeadCardContent
            lead={activeLead}
            getProductName={getProductName}
            getGroupName={getGroupName}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  getProductName: (productId?: string) => string | undefined;
  getGroupName: (groupId?: string) => string | undefined;
}

function KanbanColumn({ column, getProductName, getGroupName }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full min-h-[420px] flex-col rounded-2xl border border-transparent bg-gray-50 transition-colors ${
        isOver ? 'border-primary-200 bg-primary-50/40' : ''
      }`}
    >
      <div className="flex items-center justify-between rounded-t-2xl bg-white px-4 py-3 shadow-sm">
        <div className="font-medium text-gray-800">{column.name}</div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
          {column.leads.length}
        </span>
      </div>
      <SortableContext
        items={column.leads.map((lead) => lead.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 p-4">
          {column.leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              getProductName={getProductName}
              getGroupName={getGroupName}
            />
          ))}
          {column.leads.length === 0 && (
            <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400">
              Перетащите лида сюда
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableLeadCardProps {
  lead: Lead;
  getProductName: (productId?: string) => string | undefined;
  getGroupName: (groupId?: string) => string | undefined;
}

function SortableLeadCard({ lead, getProductName, getGroupName }: SortableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', columnId: lead.statusId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link to={`/leads/${lead.id}`}>
        <LeadCardContent
          lead={lead}
          getProductName={getProductName}
          getGroupName={getGroupName}
        />
      </Link>
    </div>
  );
}

interface LeadCardContentProps {
  lead: Lead;
  getProductName: (productId?: string) => string | undefined;
  getGroupName: (groupId?: string) => string | undefined;
  isDragging?: boolean;
}

function LeadCardContent({ lead, getProductName, getGroupName, isDragging }: LeadCardContentProps) {
  return (
    <div
      className={`block rounded-xl bg-white p-4 shadow-sm transition-transform ${
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
        <span className="text-xs text-gray-500">
          {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600">{lead.phone}</div>
      {lead.appointmentDate && (
        <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Прием: {new Date(lead.appointmentDate).toLocaleString('ru-RU')}
        </div>
      )}
      {lead.groupId && (
        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Группа: {getGroupName(lead.groupId)}
        </div>
      )}
      {lead.productId && (
        <p className="mt-2 text-xs text-gray-500">
          Продукт: {getProductName(lead.productId)}
        </p>
      )}
    </div>
  );
}
