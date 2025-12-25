/**
 * 格式化文件大小
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 格式化日期（带翻译支持）
 */
type TranslationFunction = (key: string, options?: { count?: number }) => string

export function formatDate(date: Date | string, t?: TranslationFunction): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      if (t) {
        return minutes === 0 ? t('time.justNow') : t('time.minutesAgo', { count: minutes });
      }
      return minutes === 0 ? '刚刚' : `${minutes} 分钟前`;
    }
    if (t) {
      return t('time.hoursAgo', { count: hours });
    }
    return `${hours} 小时前`;
  } else if (days === 1) {
    return t ? t('time.yesterday') : '昨天';
  } else if (days < 7) {
    if (t) {
      return t('time.daysAgo', { count: days });
    }
    return `${days} 天前`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    if (t) {
      return t('time.weeksAgo', { count: weeks });
    }
    return `${weeks} 周前`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    if (t) {
      return t('time.monthsAgo', { count: months });
    }
    return `${months} 个月前`;
  } else {
    const years = Math.floor(days / 365);
    if (t) {
      return t('time.yearsAgo', { count: years });
    }
    return `${years} 年前`;
  }
}

/**
 * 格式化完整日期时间
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 从 Git URL 提取仓库信息
 */
export function parseGitUrl(url: string): { host: string; owner: string; repo: string } | null {
  if (!url) return null;

  // 匹配 https://github.com/owner/repo.git 或 git@github.com:owner/repo.git
  const httpsMatch = url.match(/https?:\/\/([^/]+)\/([^/]+)\/([^/.]+)/)
  const sshMatch = url.match(/git@([^:]+):([^/]+)\/([^/.]+)/)

  const match = httpsMatch || sshMatch;
  if (!match) return null;

  return {
    host: match[1],
    owner: match[2],
    repo: match[3],
  };
}

/**
 * 生成项目图标（基于项目类型）
 */
export function getProjectIcon(project: { hasNodeModules?: boolean; packageManager?: string }): string {
  if (project.hasNodeModules) {
    return '⚛️'; // React/Node.js
  }
  return '📁'; // 默认文件夹
}
