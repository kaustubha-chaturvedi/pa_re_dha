/**
 * GitHub API Service
 * Handles all GitHub API operations for content management
 */

const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubFile {
  name: string
  path: string
  sha: string
  type: string
  download_url: string
  updated_at?: string
}

interface GitHubConfig {
  repoOwner: string
  repoName: string
  githubPat: string
  branch: string
}

function getGitHubConfig(): GitHubConfig {
  const githubPat = process.env.GITHUB_PAT
  if (!githubPat) {
    throw new Error('GITHUB_PAT not configured')
  }

  return {
    repoOwner: process.env.GITHUB_REPO_OWNER || 'kaustubha-chaturvedi',
    repoName: process.env.GITHUB_REPO_NAME || 'shadaj_madhyama_dhaivata',
    githubPat,
    branch: process.env.GITHUB_BRANCH || 'main',
  }
}

function encodePath(path: string): string {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Normalize path by removing apps/site prefix if present
 */
function normalizePath(path: string): string {
  // Remove apps/site/ prefix if present
  return path.replace(/^apps\/site\//, '')
}

function getAuthHeaders(githubPat: string) {
  return {
    Authorization: `Bearer ${githubPat}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Admin-CMS',
  }
}

/**
 * Fetch directory contents from GitHub
 */
export async function fetchDirectory(path: string): Promise<GitHubFile[]> {
  const config = getGitHubConfig()
  const normalizedPath = normalizePath(path)
  const encodedPath = encodePath(normalizedPath)

  // Add branch parameter to ensure we fetch from the correct branch
  const url = `${GITHUB_API_BASE}/repos/${config.repoOwner}/${config.repoName}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}`
  
  const res = await fetch(url, { headers: getAuthHeaders(config.githubPat) })

  if (!res.ok) {
    if (res.status === 404) {
      return []
    }
    const error = await res.text()
    throw new Error(`Failed to fetch directory: ${error}`)
  }

  const data = await res.json()
  
  // Handle both single file and array responses
  if (Array.isArray(data)) {
    return data
  }
  
  // If it's a single file (not a directory), return it as an array
  return [data]
}

/**
 * Fetch file content from GitHub
 */
export async function fetchFile(path: string): Promise<{ content: string; sha: string }> {
  const config = getGitHubConfig()
  const normalizedPath = normalizePath(path)
  const encodedPath = encodePath(normalizedPath)
  
  // Add branch parameter to ensure we fetch from the correct branch
  const url = `${GITHUB_API_BASE}/repos/${config.repoOwner}/${config.repoName}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}`
  
  const res = await fetch(url, { headers: getAuthHeaders(config.githubPat) })

  if (!res.ok) {
    if (res.status === 404) {
      return { content: '', sha: '' }
    }
    const error = await res.text()
    throw new Error(`Failed to fetch file: ${error}`)
  }

  const fileData = await res.json()
  const content = Buffer.from(fileData.content, 'base64').toString('utf-8')

  return { content, sha: fileData.sha }
}

/**
 * Fetch file content from download URL (for directory listings)
 */
export async function fetchFileFromUrl(downloadUrl: string): Promise<string> {
  const config = getGitHubConfig()

  const res = await fetch(downloadUrl, {
    headers: {
      ...getAuthHeaders(config.githubPat),
      Accept: 'application/vnd.github.v3.raw',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file content: ${res.statusText}`)
  }

  return res.text()
}

/**
 * Commit file to GitHub
 */
export async function commitFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<any> {
  const config = getGitHubConfig()
  const normalizedPath = normalizePath(path)
  const encodedPath = encodePath(normalizedPath)

  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: config.branch,
  }

  if (sha) {
    body.sha = sha
  }

  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${config.repoOwner}/${config.repoName}/contents/${encodedPath}`,
    {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(config.githubPat),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to commit file: ${error}`)
  }

  return res.json()
}

/**
 * Delete file from GitHub
 */
export async function deleteFile(path: string, message: string): Promise<void> {
  const config = getGitHubConfig()
  const normalizedPath = normalizePath(path)
  const encodedPath = encodePath(normalizedPath)

  // First, get the file SHA (fetchFile already normalizes the path)
  const { sha } = await fetchFile(path)
  if (!sha) {
    throw new Error('File not found')
  }

  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${config.repoOwner}/${config.repoName}/contents/${encodedPath}`,
    {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(config.githubPat),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sha,
        branch: config.branch,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to delete file: ${error}`)
  }
}

/**
 * List markdown files from a directory
 */
export async function listMarkdownFiles(
  directoryPath: string
): Promise<Array<{ name: string; path: string; downloadUrl: string; updatedAt: string }>> {
  // fetchDirectory already normalizes the path
  const files = await fetchDirectory(directoryPath)  
  const markdownFiles = files
    .filter((file) => {
      const isMarkdown = file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))
      if (!isMarkdown) {
        console.log(`[listMarkdownFiles] Skipping ${file.name} (type: ${file.type})`)
      }
      return isMarkdown
    })
    .map((file) => ({
      name: file.name,
      path: file.path,
      downloadUrl: file.download_url,
      updatedAt: file.updated_at || new Date().toISOString(),
    }))
  
  console.log(`[listMarkdownFiles] Filtered to ${markdownFiles.length} markdown files`)
  return markdownFiles
}

