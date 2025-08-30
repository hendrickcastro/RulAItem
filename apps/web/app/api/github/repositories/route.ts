import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = Math.min(parseInt(searchParams.get('per_page') || '30'), 100);
    const sort = searchParams.get('sort') || 'updated';
    const type = searchParams.get('type') || 'owner'; // owner, all, public, private, member
    const search = searchParams.get('search') || '';

    let apiUrl = `https://api.github.com/user/repos?page=${page}&per_page=${per_page}&sort=${sort}&type=${type}`;

    // If there's a search query, use the search API instead
    if (search.trim()) {
      apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(search + ' user:' + session.user.name)}&page=${page}&per_page=${per_page}&sort=${sort}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Kontexto-IA-App'
      }
    });

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'Error fetching repositories from GitHub',
        details: `${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Handle search API vs regular API response format
    const repositories = search.trim() ? data.items : data;
    const totalCount = search.trim() ? data.total_count : repositories.length;

    // Transform repository data to include only what we need
    const transformedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      private: repo.private,
      fork: repo.fork,
      archived: repo.archived,
      disabled: repo.disabled,
      default_branch: repo.default_branch,
      language: repo.language,
      languages_url: repo.languages_url,
      stargazers_count: repo.stargazers_count,
      watchers_count: repo.watchers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      size: repo.size,
      topics: repo.topics || [],
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        type: repo.owner.type
      }
    }));

    return NextResponse.json({
      repositories: transformedRepos,
      pagination: {
        page,
        per_page,
        total: totalCount,
        has_next: repositories.length === per_page
      }
    });

  } catch (error: any) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}