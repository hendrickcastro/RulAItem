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
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json({ 
        error: 'Owner and repo parameters are required',
        details: 'Please provide both owner and repo parameters'
      }, { status: 400 });
    }

    console.log(`Fetching branches for ${owner}/${repo} with token:`, session.accessToken?.substring(0, 10) + '...');

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Kontexto-IA-App'
      }
    });

    if (!response.ok) {
      console.error('GitHub API error for branches:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'Error fetching branches from GitHub',
        details: `${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const branches = await response.json();
    const branchNames = branches.map((branch: any) => branch.name);
    
    console.log(`Found ${branchNames.length} branches for ${owner}/${repo}:`, branchNames);

    return NextResponse.json({
      branches: branchNames,
      total: branchNames.length,
      repository: `${owner}/${repo}`
    });

  } catch (error: any) {
    console.error('Error fetching GitHub branches:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}