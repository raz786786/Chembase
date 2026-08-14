import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Connection, Edge, Node } from '@xyflow/react';
import { Trash2, Layers } from 'lucide-react';

// Define the custom node for Equipment
const EquipmentNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Equipment');

  const onBlur = () => {
    setIsEditing(false);
    updateNodeData(id, { label });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur();
    }
  };

  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-xl bg-surface-50 dark:bg-surface-900 border-2 transition-all ${selected ? 'border-accent-500 shadow-accent-500/20 scale-105' : 'border-surface-200 dark:border-surface-700'}`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ width: '14px', height: '14px', left: '-7px', zIndex: 10, cursor: 'crosshair' }}
        className="bg-accent-500 border-2 border-white dark:border-surface-900" 
      />
      <div className="flex items-center gap-3">
        <div className="p-2 bg-surface-100 dark:bg-surface-800 rounded-lg text-accent-600 dark:text-accent-400 font-bold">
          {data.icon || '??'}
        </div>
        <div>
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              autoFocus
              className="text-xs font-black text-surface-900 dark:text-surface-100 uppercase tracking-wider bg-transparent border-b-2 border-accent-500 outline-none w-24"
            />
          ) : (
            <div className="text-xs font-black text-surface-900 dark:text-surface-100 uppercase tracking-wider cursor-text" title="Double click to rename">{data.label}</div>
          )}
          <div className="text-[10px] text-surface-500 font-bold">{data.id}</div>
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ width: '14px', height: '14px', right: '-7px', zIndex: 10, cursor: 'crosshair' }}
        className="bg-accent-500 border-2 border-white dark:border-surface-900" 
      />
    </div>
  );
};

const nodeTypes = {
  equipment: EquipmentNode,
};

const EQUIPMENT_PALETTE = [
  { type: 'Pump', icon: 'P' },
  { type: 'Compressor', icon: 'C' },
  { type: 'Reactor', icon: 'R' },
  { type: 'Column', icon: 'Col' },
  { type: 'Tank', icon: 'T' },
  { type: 'Heat Exchanger', icon: 'HE' },
  { type: 'Separator', icon: 'Sep' },
  { type: 'Mixer', icon: 'M' },
  { type: 'Valve', icon: 'V' },
  { type: 'Furnace', icon: 'F' },
  { type: 'Heater', icon: 'H' },
  { type: 'Cooler', icon: 'C' },
  { type: 'Boiler', icon: 'B' },
  { type: 'Turbine', icon: 'Tu' },
  { type: 'Dryer', icon: 'D' },
  { type: 'Flare', icon: 'Fl' },
  { type: 'Cyclone', icon: 'Cy' },
  { type: 'Extruder', icon: 'E' },
  { type: 'Filter', icon: 'Fi' },
  { type: 'Custom Box', icon: '?' },
];

let idCounter = 1;
const getId = (prefix: string) => `${prefix}-${idCounter++}`;

const FlowEditor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    } as any, eds));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const equipData = JSON.parse(type);

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = getId(equipData.type.substring(0, 3).toUpperCase());
      const newNode = {
        id: newId,
        type: 'equipment',
        position,
        data: { label: equipData.type, icon: equipData.icon, id: newId },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const clearCanvas = () => {
    if(confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      idCounter = 1;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 h-[600px] w-full rounded-3xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 overflow-hidden shadow-sm">
      
      {/* Sidebar Palette */}
      <div className="w-full md:w-72 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col z-10 shadow-xl shadow-black/5">
        <div className="p-5 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-sm font-black text-surface-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-500" /> Equipment Palette
          </h3>
          <p className="text-[10px] text-surface-500 mt-1.5 uppercase tracking-wider font-bold">Drag components to canvas</p>
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3 custom-scrollbar">
          {EQUIPMENT_PALETTE.map((eq) => (
            <div
              key={eq.type}
              className="px-2 py-4 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:border-accent-400 dark:hover:border-accent-600 cursor-grab flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-md group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', JSON.stringify(eq));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-black text-sm group-hover:text-accent-500 group-hover:bg-accent-50 dark:group-hover:bg-accent-900/20 transition-colors shadow-sm">
                {eq.icon}
              </div>
              <span className="text-[11px] font-bold text-surface-600 dark:text-surface-400 text-center leading-tight">{eq.type}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
          <button onClick={clearCanvas} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold">
            <Trash2 className="w-4 h-4" /> Clear Flowsheet
          </button>
        </div>
      </div>

      {/* Canvas Workspace */}
      <div className="flex-1 relative bg-[#f8fafc] dark:bg-[#020617]" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls className="bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 fill-surface-700 dark:fill-surface-300 shadow-md rounded-xl overflow-hidden" />
          <Background color="#cbd5e1" gap={24} size={2} />
        </ReactFlow>
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm p-8 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4 border border-surface-200 dark:border-surface-700">
                <Layers className="w-8 h-8 text-surface-400 dark:text-surface-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-surface-800 dark:text-surface-100 mb-1">Canvas is empty</h3>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Drag equipment from the palette</p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">Connect nodes by dragging between blue dots</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PfdFlowchartEditor() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </div>
  );
}
