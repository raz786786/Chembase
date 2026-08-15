import { useMemo, useCallback } from 'react';
import { ReactFlow, Controls, Background, Handle, Position } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { IndustrialProcess } from '../data/types';
import { Activity } from 'lucide-react';

const ProcessNode = ({ data }: { data: any }) => {
  return (
    <div className="px-6 py-4 shadow-lg rounded-2xl bg-white dark:bg-surface-900 border-2 border-primary-500 min-w-[200px] text-center cursor-pointer hover:shadow-primary-500/20 hover:-translate-y-1 transition-all">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary-500" />
      <div className="flex items-center justify-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
        <Activity className="w-5 h-5" />
      </div>
      <div className="font-black text-surface-900 dark:text-white uppercase tracking-wider text-sm">{data.name}</div>
      <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">{data.id}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary-500" />
    </div>
  );
};

const nodeTypes = { processNode: ProcessNode };

export default function ProcessFlowViewer({ processes, onProcessClick }: { processes: IndustrialProcess[], onProcessClick: (id: string) => void }) {
  
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // A simple linear vertical layout assuming processes are ordered topologically
    processes.forEach((proc, index) => {
      nodes.push({
        id: proc.id,
        type: 'processNode',
        position: { x: 250, y: index * 150 + 50 },
        data: { name: proc.name, id: proc.id }
      });

      proc.nextProcessIds.forEach(nextId => {
        edges.push({
          id: `${proc.id}-${nextId}`,
          source: proc.id,
          target: nextId,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 3 },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [processes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    onProcessClick(node.id);
  }, [onProcessClick]);

  return (
    <div className="w-full h-[600px] bg-surface-50 dark:bg-surface-950 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        className="w-full h-full"
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
