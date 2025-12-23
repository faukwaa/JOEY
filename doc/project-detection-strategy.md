# 项目根目录识别策略

## 核心问题

如何在扫描本地文件夹时，准确识别哪些文件夹是项目的根目录？

### 挑战
1. **嵌套项目**：一个项目中可能包含子项目（monorepo）
2. **误判**：某些非项目文件夹可能包含配置文件
3. **性能**：深度扫描可能耗时
4. **可扩展性**：需要支持多种项目类型

---

## 识别策略

### 方案一：基于标记文件识别（推荐）

#### 核心逻辑
检查文件夹中是否存在特定的**项目标记文件**或**目录**。

#### 优先级规则
```
1. .git 目录 (最高优先级)
2. package.json
3. pyproject.toml / setup.py / requirements.txt
4. Cargo.toml
5. go.mod
6. pom.xml / build.gradle
7. Gemfile
8. composer.json
9. 其他项目配置文件
```

#### 实现示例

```typescript
// src/shared/project-detectors.ts

interface ProjectDetector {
  name: string;
  type: ProjectType;
  priority: number; // 优先级，数字越大越优先
  check: (path: string) => Promise<boolean>;
}

enum ProjectType {
  Git = 'git',
  NodeJS = 'nodejs',
  Python = 'python',
  Rust = 'rust',
  Go = 'go',
  Java = 'java',
  Ruby = 'ruby',
  PHP = 'php',
  Other = 'other'
}

const PROJECT_DETECTORS: ProjectDetector[] = [
  {
    name: 'Git Repository',
    type: ProjectType.Git,
    priority: 100,
    check: async (path) => {
      const gitPath = join(path, '.git');
      return await exists(gitPath);
    }
  },
  {
    name: 'Node.js',
    type: ProjectType.NodeJS,
    priority: 90,
    check: async (path) => {
      return await exists(join(path, 'package.json'));
    }
  },
  {
    name: 'Python',
    type: ProjectType.Python,
    priority: 80,
    check: async (path) => {
      const files = ['pyproject.toml', 'setup.py', 'requirements.txt', 'setup.cfg'];
      for (const file of files) {
        if (await exists(join(path, file))) return true;
      }
      return false;
    }
  },
  {
    name: 'Rust',
    type: ProjectType.Rust,
    priority: 85,
    check: async (path) => {
      return await exists(join(path, 'Cargo.toml'));
    }
  },
  {
    name: 'Go',
    type: ProjectType.Go,
    priority: 85,
    check: async (path) => {
      return await exists(join(path, 'go.mod'));
    }
  },
  {
    name: 'Java (Maven)',
    type: ProjectType.Java,
    priority: 75,
    check: async (path) => {
      return await exists(join(path, 'pom.xml'));
    }
  },
  {
    name: 'Java (Gradle)',
    type: ProjectType.Java,
    priority: 75,
    check: async (path) => {
      return await exists(join(path, 'build.gradle')) ||
             await exists(join(path, 'build.gradle.kts'));
    }
  },
  {
    name: 'Ruby',
    type: ProjectType.Ruby,
    priority: 70,
    check: async (path) => {
      return await exists(join(path, 'Gemfile'));
    }
  },
  {
    name: 'PHP',
    type: ProjectType.PHP,
    priority: 70,
    check: async (path) => {
      return await exists(join(path, 'composer.json'));
    }
  }
];

async function detectProjectType(path: string): Promise<{
  isProject: boolean;
  type: ProjectType;
  priority: number;
}> {
  for (const detector of PROJECT_DETECTORS) {
    if (await detector.check(path)) {
      return {
        isProject: true,
        type: detector.type,
        priority: detector.priority
      };
    }
  }

  return {
    isProject: false,
    type: ProjectType.Other,
    priority: 0
  };
}
```

---

## 扫描策略

### 方案 A：广度优先扫描（推荐用于一般场景）

```typescript
interface ScanOptions {
  rootPath: string;
  maxDepth?: number; // 最大深度，防止无限递归
  ignorePatterns?: string[]; // 忽略的文件夹模式
  stopAtProject?: boolean; // 遇到项目后是否停止扫描子目录
}

async function scanDirectory(options: ScanOptions): Promise<string[]> {
  const {
    rootPath,
    maxDepth = 5,
    ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'target'],
    stopAtProject = true
  } = options;

  const projectPaths: string[] = [];

  async function traverse(currentPath: string, depth: number) {
    // 深度检查
    if (depth > maxDepth) return;

    // 忽略特定目录
    const dirName = basename(currentPath);
    if (ignorePatterns.includes(dirName)) return;

    // 检查是否是项目根目录
    const detection = await detectProjectType(currentPath);

    if (detection.isProject) {
      projectPaths.push(currentPath);

      // 如果配置为遇到项目后停止，则不再扫描子目录
      if (stopAtProject) {
        return;
      }
    }

    // 递归扫描子目录
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(currentPath, entry.name);
        await traverse(fullPath, depth + 1);
      }
    }
  }

  await traverse(rootPath, 0);
  return projectPaths;
}
```

### 方案 B：深度优先扫描（适用于 monorepo 场景）

适用于需要识别 monorepo 中所有子项目的场景。

```typescript
async function scanForMonorepos(rootPath: string): Promise<{
  rootProjects: string[];
  subProjects: Map<string, string[]>; // 父项目 -> 子项目列表
}> {
  const allProjects: string[] = [];
  const parentChildMap = new Map<string, string[]>();

  async function findProjects(currentPath: string, parentPath: string | null) {
    const detection = await detectProjectType(currentPath);

    if (detection.isProject) {
      allProjects.push(currentPath);

      if (parentPath) {
        if (!parentChildMap.has(parentPath)) {
          parentChildMap.set(parentPath, []);
        }
        parentChildMap.get(parentPath)!.push(currentPath);
      }

      // 继续扫描子目录，查找子项目
      const entries = await readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !shouldIgnore(entry.name)) {
          await findProjects(join(currentPath, entry.name), currentPath);
        }
      }
    }
  }

  await findProjects(rootPath, null);

  // 分析 monorepo 结构
  const rootProjects = allProjects.filter(p => {
    const parent = dirname(p);
    return !allProjects.includes(parent);
  });

  return {
    rootProjects,
    subProjects: parentChildMap
  };
}
```

---

## 特殊场景处理

### 1. Monorepo 识别

```typescript
// 检测是否是 monorepo
async function detectMonorepo(path: string): Promise<boolean> {
  const packageJsonPath = join(path, 'package.json');

  if (!await exists(packageJsonPathPath)) {
    return false;
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

  // 检查 monorepo 标记
  const hasWorkspaces = !!packageJson.workspaces;
  const hasTurbo = await exists(join(path, 'turbo.json'));
  const hasNx = await exists(join(path, 'nx.json'));
  const hasLerna = await exists(join(path, 'lerna.json'));

  return hasWorkspaces || hasTurbo || hasNx || hasLerna;
}

// monorepo 子项目扫描
async function scanMonorepoPackages(rootPath: string): Promise<string[]> {
  const packageJsonPath = join(path, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

  const workspaces = packageJson.workspaces;
  const packagesPaths: string[] = [];

  if (Array.isArray(workspaces)) {
    // workspaces: ['packages/*', 'apps/*']
    for (const pattern of workspaces) {
      const globPath = join(rootPath, pattern);
      const matches = await glob(globPath, { onlyDirectories: true });
      packagesPaths.push(...matches);
    }
  } else if (workspaces.packages) {
    // workspaces: { packages: ['packages/*'] }
    for (const pattern of workspaces.packages) {
      const globPath = join(rootPath, pattern);
      const matches = await glob(globPath, { onlyDirectories: true });
      packagesPaths.push(...matches);
    }
  }

  return packagesPaths;
}
```

### 2. 嵌套项目处理

```typescript
interface NestedProjectStrategy {
  mode: 'stop' | 'continue' | 'smart';
}

// 'stop': 遇到项目后停止扫描子目录
// 'continue': 继续扫描所有子目录
// 'smart': 智能判断（检测到 monorepo 时继续）

async function smartScan(
  rootPath: string,
  strategy: NestedProjectStrategy = { mode: 'smart' }
): Promise<ProjectScanResult[]> {
  const results: ProjectScanResult[] = [];

  async function traverse(path: string, depth: number) {
    const detection = await detectProjectType(path);

    if (detection.isProject) {
      results.push({
        path,
        isValidProject: true,
        projectType: detection.type,
        metadata: await collectProjectMetadata(path, detection.type)
      });

      // 智能判断是否继续扫描
      if (strategy.mode === 'stop') {
        return;
      }

      if (strategy.mode === 'smart') {
        const isMonorepo = await detectMonorepo(path);
        if (!isMonorepo) {
          return; // 不是 monorepo，停止扫描
        }
        // 是 monorepo，继续扫描子项目
      }
    }

    // 继续扫描子目录
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !shouldIgnore(entry.name)) {
        await traverse(join(path, entry.name), depth + 1);
      }
    }
  }

  await traverse(rootPath, 0);
  return results;
}
```

### 3. 虚假项目过滤

某些文件夹可能包含 package.json 但不是真实项目（如配置文件目录）。

```typescript
async function isRealProject(path: string, type: ProjectType): Promise<boolean> {
  if (type === ProjectType.NodeJS) {
    const packageJson = JSON.parse(
      await readFile(join(path, 'package.json'), 'utf-8')
    );

    // 检查是否有实际的依赖或脚本
    const hasDependencies =
      Object.keys(packageJson.dependencies || {}).length > 0 ||
      Object.keys(packageJson.devDependencies || {}).length > 0;

    const hasScripts =
      packageJson.scripts && Object.keys(packageJson.scripts).length > 0;

    // 至少满足一个条件才认为是真实项目
    return hasDependencies || hasScripts;
  }

  return true;
}
```

---

## 用户配置选项

```typescript
interface UserScanConfig {
  // 扫描模式
  scanMode: 'standard' | 'monorepo' | 'aggressive';

  // 最大深度
  maxDepth: number;

  // 是否在检测到项目后停止
  stopAtProject: boolean;

  // 忽略的目录名
  ignoreDirs: string[];

  // 启用的项目类型检测器
  enabledDetectors: ProjectType[];

  // 自定义检测规则
  customDetectors: Array<{
    name: string;
    files: string[];
    priority: number;
  }>;
}

// 默认配置
const DEFAULT_SCAN_CONFIG: UserScanConfig = {
  scanMode: 'standard',
  maxDepth: 5,
  stopAtProject: true,
  ignoreDirs: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'target',
    'vendor',
    'out',
    '.next',
    '.nuxt'
  ],
  enabledDetectors: [
    ProjectType.Git,
    ProjectType.NodeJS,
    ProjectType.Python,
    ProjectType.Rust,
    ProjectType.Go,
    ProjectType.Java
  ],
  customDetectors: []
};
```

---

## 性能优化

### 1. 并行扫描

```typescript
import { Worker } from 'worker_threads';

async function parallelScan(paths: string[]): Promise<ProjectScanResult[]> {
  const workers = new Array<Worker>();
  const results = new Array<ProjectScanResult>();

  // 创建 Worker 池
  const cpuCount = os.cpus().length;
  const workerPromises = paths.map(path => {
    return new Promise<ProjectScanResult>((resolve) => {
      const worker = new Worker('./scan-worker.js', {
        workerData: { path }
      });

      worker.on('message', resolve);
      worker.on('exit', () => worker.terminate());

      workers.push(worker);
    });
  });

  const allResults = await Promise.all(workerPromises);

  // 清理 workers
  workers.forEach(w => w.terminate());

  return allResults;
}
```

### 2. 缓存机制

```typescript
class ScanCache {
  private cache = new Map<string, {
    result: ProjectScanResult;
    timestamp: number;
  }>();

  private TTL = 5 * 60 * 1000; // 5 分钟过期

  async get(path: string): Promise<ProjectScanResult | null> {
    const cached = this.cache.get(path);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(path);
      return null;
    }

    return cached.result;
  }

  async set(path: string, result: ProjectScanResult): Promise<void> {
    this.cache.set(path, {
      result,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 3. 增量扫描

```typescript
async function incrementalScan(
  rootPath: string,
  previousResults: Map<string, ProjectScanResult>
): Promise<{
  added: ProjectScanResult[];
  modified: ProjectScanResult[];
  unchanged: ProjectScanResult[];
}> {
  const newResults = await smartScan(rootPath);

  const newMap = new Map(newResults.map(r => [r.path, r]));
  const changes = {
    added: [] as ProjectScanResult[],
    modified: [] as ProjectScanResult[],
    unchanged: [] as ProjectScanResult[]
  };

  // 检测新增和修改
  for (const [path, result] of newMap) {
    const prev = previousResults.get(path);

    if (!prev) {
      changes.added.push(result);
    } else if (hasChanged(prev, result)) {
      changes.modified.push(result);
    } else {
      changes.unchanged.push(prev);
    }
  }

  return changes;
}

function hasChanged(
  prev: ProjectScanResult,
  curr: ProjectScanResult
): boolean {
  // 比较关键字段
  return (
    prev.metadata?.updatedAt !== curr.metadata?.updatedAt ||
    prev.metadata?.size !== curr.metadata?.size ||
    prev.metadata?.lastCommit !== curr.metadata?.lastCommit
  );
}
```

---

## 推荐的扫描流程

```typescript
async function scanProjects(rootPath: string): Promise<Project[]> {
  // 1. 检查缓存
  const cached = await cache.get(rootPath);
  if (cached) return cached;

  // 2. 执行扫描
  const scanResults = await smartScan(rootPath, {
    mode: 'smart'
  });

  // 3. 过滤虚假项目
  const realProjects = await filterRealProjects(scanResults);

  // 4. 收集完整元数据
  const projects = await Promise.all(
    realProjects.map(result => collectFullProjectMetadata(result))
  );

  // 5. 缓存结果
  await cache.set(rootPath, projects);

  return projects;
}
```

---

## 总结

### 最佳实践建议

1. **默认使用广度优先扫描** + `stopAtProject = true`
   - 适合大多数场景
   - 性能好，误判少

2. **提供扫描选项给用户**
   - 标准模式：遇到项目后停止
   - Monorepo 模式：智能识别并扫描子项目
   - 激进模式：扫描所有可能的子项目

3. **优先使用 `.git` 目录作为判断依据**
   - 最可靠的项目标识
   - 适用于几乎所有项目类型

4. **实现缓存机制**
   - 避免重复扫描
   - 显著提升性能

5. **允许用户自定义检测规则**
   - 不同用户的需求不同
   - 提供灵活的配置选项

### 实施建议

建议先实现基础的**标记文件识别 + 广度优先扫描**，然后根据实际需求逐步添加 monorepo 支持、缓存优化等高级功能。
