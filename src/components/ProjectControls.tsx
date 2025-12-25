import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SortAscIcon, SortDescIcon, RefreshCwIcon, SearchIcon, XIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  searchQuery: string | null
  onSearchChange: (query: string) => void
  isSearching: boolean
}

function ProjectControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onRescan,
  projectCount,
  searchQuery,
  onSearchChange,
  isSearching
}: ProjectControlsProps) {
  const { t } = useTranslation()

  const sortLabels: Record<typeof sortBy, string> = {
    name: t('controls.sortByName'),
    size: t('controls.sortBySize'),
    createdAt: t('controls.sortByCreated'),
    updatedAt: t('controls.sortByUpdated')
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {searchQuery !== null ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('controls.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-8 w-64 pr-8"
                autoFocus
              />
              {isSearching && (
                <LoaderIcon className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8"
                  onClick={() => onSearchChange('')}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearchChange('')}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {sortOrder === 'asc' ? (
              <SortAscIcon className="h-4 w-4 mr-2" />
            ) : (
              <SortDescIcon className="h-4 w-4 mr-2" />
            )}
            {sortLabels[sortBy]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortByChange('name')}>
            {t('controls.sortByName')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('size')}>
            {t('controls.sortBySize')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('createdAt')}>
            {t('controls.sortByCreated')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('updatedAt')}>
            {t('controls.sortByUpdated')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSortOrderChange}>
            {sortOrder === 'asc' ? t('controls.descending') : t('controls.ascending')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {projectCount > 0 && (
        <Button variant="outline" size="sm" onClick={onRescan}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          {t('scan.rescan')}
        </Button>
      )}
    </div>
  )
}

export default memo(ProjectControls)
