import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Function to get commit details with diff from GitHub API
async function getCommitDetails(repoUrl: string, sha: string, accessToken: string) {
  const [, , , owner, repo] = repoUrl.split('/');
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RulAItem-Analysis'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const commit = await response.json();
    
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatar_url: commit.author?.avatar_url
      },
      date: commit.commit.author.date,
      stats: {
        total: commit.stats?.total || 0,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
      },
      files: commit.files ? commit.files.map((file: any) => ({
        filename: file.filename,
        status: file.status, // "added", "removed", "modified"
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch, // The diff content
        raw_url: file.raw_url,
        blob_url: file.blob_url
      })) : [],
      parents: commit.parents?.map((parent: any) => parent.sha) || [],
      html_url: commit.html_url
    };
  } catch (error) {
    console.error(`Error fetching commit details for ${sha}:`, error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sha: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get('repoUrl');
    
    if (!repoUrl) {
      return NextResponse.json(
        { error: 'repoUrl es requerido' },
        { status: 400 }
      );
    }

    const commitDetails = await getCommitDetails(
      repoUrl,
      params.sha,
      session.accessToken
    );

    return NextResponse.json({ commit: commitDetails });
  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}