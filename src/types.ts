// 项目数据结构
export interface Project {
  id: string;                    // 唯一标识
  name: string;                  // 项目名称
  path: string;                  // 项目绝对路径
  scanFolder?: string;           // 所属的扫描目录

  // 时间信息
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 最后修改时间
  addedAt: Date;                 // 添加到应用的时间

  // 存储信息
  size: number;                  // 字节大小
  hasNodeModules: boolean;       // 是否有 node_modules

  // Git 信息
  gitRemote?: string;            // 远程仓库地址
  gitBranch?: string;            // 当前分支
  lastCommit?: string;           // 最后提交信息
  gitStatus?: 'clean' | 'modified' | 'error' | 'no-git'; // Git 工作区状态
  gitChanges?: number;           // 未提交的变更数量

  // 包信息
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  dependencies?: string[];       // 主要依赖

  // 元数据
  tags?: string[];               // 用户标签
  notes?: string;                // 备注
  icon?: string;                 // 自定义图标
  favorite?: boolean;            // 是否收藏
}

// 扫描目录时的临时数据
export interface ProjectScanResult {
  path: string;
  isValidProject: boolean;
  projectType?: 'nodejs' | 'python' | 'rust' | 'go' | 'other';
  metadata?: Partial<Project>;
}

// 视图模式
export type ViewMode = 'grid' | 'table';

// 排序方式
export type SortBy = 'name' | 'createdAt' | 'updatedAt' | 'size';
export type SortOrder = 'asc' | 'desc';

// 用户设置
export interface UserSettings {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  folders: string[];             // 监控的文件夹列表
}
