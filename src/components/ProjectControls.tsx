import { SortAscIcon, SortDescIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectControlsProps {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'size'
  sortOrder: 'asc' | 'desc'
  onSortByChange: (value: 'name' | 'createdAt' | 'updatedAt' | 'size') => void
  onSortOrderChange: () => void
  onRescan: () => void
  projectCount: number
}

export function ProjectControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onRescan,
  projectCount
}: ProjectControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* 排序 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {sortOrder === 'asc' ? (
              <SortAscIcon className="h-4 w-4 mr-2" />
            ) : (
              <SortDescIcon className="h-4 w-4 mr-2" />
            )}
            {sortBy === 'name' && '按名称'}
            {sortBy === 'size' && '按大小'}
            {sortBy === 'createdAt' && '按创建时间'}
            {sortBy === 'updatedAt' && '按更新时间'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortByChange('name')}>
            按名称
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('size')}>
            按大小
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('createdAt')}>
            按创建时间
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('updatedAt')}>
            按更新时间
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSortOrderChange}>
            {sortOrder === 'asc' ? '降序' : '升序'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 重新扫描 - 只在有项目时显示 */}
      {projectCount > 0 && (
        <Button variant="outline" size="sm" onClick={onRescan}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          重新扫描
        </Button>
      )}
    </div>
  )
}
