import { ChevronRightIcon, FolderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeNode } from '@/hooks/useDirectoryTree'

interface TreeViewProps {
  tree: TreeNode | null
  selectedPath: string | null
  onNodeSelect: (nodePath: string) => void
  onNodeToggle: (nodePath: string) => void
}

interface TreeNodeProps {
  node: TreeNode
  selectedPath: string | null
  onNodeSelect: (nodePath: string) => void
  onNodeToggle: (nodePath: string) => void
}

function TreeNodeComponent({ node, selectedPath, onNodeSelect, onNodeToggle }: TreeNodeProps) {
  const isSelected = selectedPath === node.path
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded-sm cursor-pointer hover:bg-accent text-sm',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        onClick={() => onNodeSelect(node.path)}
      >
        {hasChildren && (
          <span
            className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation()
              onNodeToggle(node.path)
            }}
          >
            <ChevronRightIcon
              className={cn(
                'h-3 w-3 transition-transform',
                node.isExpanded && 'transform rotate-90'
              )}
            />
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <FolderIcon className={cn('h-4 w-4', node.hasProjects ? 'text-primary' : 'text-muted-foreground')} />
        <span className={cn('flex-1 truncate', node.hasProjects && 'font-medium')}>
          {node.name}
        </span>
      </div>

      {node.isExpanded && node.children.map((child) => (
        <TreeNodeComponent
          key={child.path}
          node={child}
          selectedPath={selectedPath}
          onNodeSelect={onNodeSelect}
          onNodeToggle={onNodeToggle}
        />
      ))}
    </div>
  )
}

export function TreeView({ tree, selectedPath, onNodeSelect, onNodeToggle }: TreeViewProps) {
  if (!tree) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        暂无目录树
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 pb-2">
        <div className="text-xs font-semibold text-muted-foreground">目录结构</div>
      </div>
      {tree.children.map((node) => (
        <TreeNodeComponent
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onNodeSelect={onNodeSelect}
          onNodeToggle={onNodeToggle}
        />
      ))}
    </div>
  )
}
