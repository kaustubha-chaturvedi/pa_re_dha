import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { isDevelopment } from "@/lib/env"

/**
 * Test endpoint to diagnose GitHub API issues
 * Returns detailed information about what's working and what's not
 */
export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env.APP_ENV,
      isDevelopment: isDevelopment(),
    },
    config: {
      hasGithubPat: !!process.env.GITHUB_PAT,
      githubPatLength: process.env.GITHUB_PAT?.length || 0,
      repoOwner: process.env.GITHUB_REPO_OWNER || 'not set',
      repoName: process.env.GITHUB_REPO_NAME || 'not set',
      branch: process.env.GITHUB_BRANCH || 'not set',
    },
    auth: {
      status: 'not checked',
    },
    githubApi: {
      status: 'not tested',
    },
  }

  // Test authentication
  try {
    if (!isDevelopment()) {
      const authResult = await requireAuth()
      results.auth = {
        status: 'success',
        username: authResult.username,
      }
    } else {
      results.auth = {
        status: 'skipped (development mode)',
      }
    }
  } catch (error: any) {
    results.auth = {
      status: 'failed',
      error: error.message,
    }
  }

  // Test GitHub API connectivity
  try {
    const githubPat = process.env.GITHUB_PAT
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'kaustubha-chaturvedi'
    const repoName = process.env.GITHUB_REPO_NAME || 'shadaj_madhyama_dhaivata'
    const branch = process.env.GITHUB_BRANCH || 'main'

    if (!githubPat) {
      results.githubApi = {
        status: 'failed',
        error: 'GITHUB_PAT not set',
      }
      return NextResponse.json(results, { status: 200 })
    }

    // Test 1: Simple API call to get repo info
    const repoUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`
    results.githubApi.test1_repoInfo = {
      url: repoUrl,
      status: 'testing...',
    }

    const repoRes = await fetch(repoUrl, {
      headers: {
        Authorization: `Bearer ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Admin-CMS-Test',
      },
    })

    results.githubApi.test1_repoInfo = {
      url: repoUrl,
      status: repoRes.ok ? 'success' : 'failed',
      statusCode: repoRes.status,
      statusText: repoRes.statusText,
    }

    if (!repoRes.ok) {
      const errorText = await repoRes.text()
      results.githubApi.test1_repoInfo.error = errorText.substring(0, 500)
      results.githubApi.status = 'failed at test 1'
      return NextResponse.json(results, { status: 200 })
    }

    const repoData = await repoRes.json()
    results.githubApi.test1_repoInfo.repoName = repoData.name
    results.githubApi.test1_repoInfo.defaultBranch = repoData.default_branch

    // Test 2: List contents of a directory
    const contentsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/src/content/posts?ref=${encodeURIComponent(branch)}`
    results.githubApi.test2_listContents = {
      url: contentsUrl,
      status: 'testing...',
    }

    const contentsRes = await fetch(contentsUrl, {
      headers: {
        Authorization: `Bearer ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Admin-CMS-Test',
      },
    })

    results.githubApi.test2_listContents = {
      url: contentsUrl,
      status: contentsRes.ok ? 'success' : 'failed',
      statusCode: contentsRes.status,
      statusText: contentsRes.statusText,
    }

    if (!contentsRes.ok) {
      const errorText = await contentsRes.text()
      results.githubApi.test2_listContents.error = errorText.substring(0, 500)
      results.githubApi.status = 'failed at test 2'
      return NextResponse.json(results, { status: 200 })
    }

    const contentsData = await contentsRes.json()
    results.githubApi.test2_listContents.fileCount = Array.isArray(contentsData) ? contentsData.length : 'not an array'

    // Test 3: Get a specific file
    if (Array.isArray(contentsData) && contentsData.length > 0) {
      const firstFile = contentsData[0]
      const fileUrl = firstFile.url || `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${firstFile.path}?ref=${encodeURIComponent(branch)}`
      
      results.githubApi.test3_getFile = {
        url: fileUrl,
        path: firstFile.path,
        status: 'testing...',
      }

      const fileRes = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${githubPat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Admin-CMS-Test',
        },
      })

      results.githubApi.test3_getFile = {
        url: fileUrl,
        path: firstFile.path,
        status: fileRes.ok ? 'success' : 'failed',
        statusCode: fileRes.status,
        statusText: fileRes.statusText,
      }

      if (!fileRes.ok) {
        const errorText = await fileRes.text()
        results.githubApi.test3_getFile.error = errorText.substring(0, 500)
        results.githubApi.status = 'failed at test 3'
      } else {
        const fileData = await fileRes.json()
        results.githubApi.test3_getFile.hasContent = !!fileData.content
        results.githubApi.status = 'all tests passed'
      }
    } else {
      results.githubApi.test3_getFile = {
        status: 'skipped (no files found)',
      }
      results.githubApi.status = 'partial success (no files to test)'
    }
  } catch (error: any) {
    results.githubApi.status = 'exception'
    results.githubApi.error = error.message
    results.githubApi.stack = error.stack?.substring(0, 500)
  }

  return NextResponse.json(results, { status: 200 })
}

