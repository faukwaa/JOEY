import { useEffect, useState } from 'react'
import { MinusIcon, SquareIcon, CopyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // 检查初始窗口状态
    window.electronAPI.windowIsMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize = () => {
    window.electronAPI.windowMinimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI.windowMaximize()
    const maximized = await window.electronAPI.windowIsMaximized()
    setIsMaximized(maximized)
  }

  const handleClose = () => {
    window.electronAPI.windowClose()
  }

  return (
    <div className="flex h-8 items-center justify-end bg-background border-b px-2 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className={cn(
            "h-7 w-11 flex items-center justify-center rounded-sm",
            "hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
          aria-label="最小化"
        >
          <MinusIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          onClick={handleMaximize}
          className={cn(
            "h-7 w-11 flex items-center justify-center rounded-sm",
            "hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
          aria-label={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <CopyIcon className="h-3 w-3" strokeWidth={2} />
          ) : (
            <SquareIcon className="h-3 w-3" strokeWidth={2} />
          )}
        </button>
        <button
          onClick={handleClose}
          className={cn(
            "h-7 w-11 flex items-center justify-center rounded-sm",
            "hover:bg-red-600 hover:text-white transition-colors",
            "text-muted-foreground"
          )}
          aria-label="关闭"
        >
          <SquareIcon className="h-3.5 w-3.5 rotate-45" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
