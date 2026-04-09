import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GITHUB_API = "https://api.github.com";

async function ghFetch(path: string) {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "lovable-mcp-server",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error [${res.status}]: ${body}`);
  }
  return res.json();
}

// Tool definitions
const tools: Record<string, { description: string; handler: (params: any) => Promise<any> }> = {
  list_repos: {
    description: "List GitHub repositories for the authenticated user",
    handler: async ({ type, per_page }: any) => {
      const t = type || "owner";
      const pp = per_page || 30;
      const repos = await ghFetch(`/user/repos?type=${t}&per_page=${pp}&sort=updated`);
      return repos.map((r: any) => ({
        name: r.full_name, description: r.description, language: r.language,
        stars: r.stargazers_count, url: r.html_url, private: r.private, updated_at: r.updated_at,
      }));
    },
  },
  get_repo: {
    description: "Get details of a specific GitHub repository",
    handler: async ({ owner, repo }: any) => {
      const data = await ghFetch(`/repos/${owner}/${repo}`);
      return {
        full_name: data.full_name, description: data.description, language: data.language,
        stars: data.stargazers_count, forks: data.forks_count, open_issues: data.open_issues_count,
        default_branch: data.default_branch, url: data.html_url, topics: data.topics,
      };
    },
  },
  list_files: {
    description: "List files in a GitHub repository path",
    handler: async ({ owner, repo, path, ref }: any) => {
      const p = path || "";
      const r = ref ? `?ref=${ref}` : "";
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${p}${r}`);
      const files = Array.isArray(data)
        ? data.map((f: any) => ({ name: f.name, type: f.type, size: f.size, path: f.path }))
        : [{ name: data.name, type: data.type, size: data.size, path: data.path }];
      return files;
    },
  },
  read_file: {
    description: "Read file content from a GitHub repository",
    handler: async ({ owner, repo, path, ref }: any) => {
      const r = ref ? `?ref=${ref}` : "";
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${path}${r}`);
      if (data.type !== "file") return { error: `${path} is a ${data.type}, not a file` };
      const decoded = atob(data.content.replace(/\n/g, ""));
      return { content: decoded };
    },
  },
  list_issues: {
    description: "List issues in a GitHub repository",
    handler: async ({ owner, repo, state, per_page }: any) => {
      const s = state || "open";
      const pp = per_page || 20;
      const issues = await ghFetch(`/repos/${owner}/${repo}/issues?state=${s}&per_page=${pp}`);
      return issues.map((i: any) => ({
        number: i.number, title: i.title, state: i.state, author: i.user?.login,
        labels: i.labels?.map((l: any) => l.name), created_at: i.created_at, comments: i.comments,
      }));
    },
  },
  search_repos: {
    description: "Search GitHub repositories",
    handler: async ({ query, per_page }: any) => {
      const pp = per_page || 10;
      const data = await ghFetch(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${pp}`);
      return data.items.map((r: any) => ({
        name: r.full_name, description: r.description, stars: r.stargazers_count,
        language: r.language, url: r.html_url,
      }));
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tool, params } = await req.json();
    if (!tool || !tools[tool]) {
      return new Response(JSON.stringify({ error: "Unknown tool", available: Object.keys(tools) }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await tools[tool].handler(params || {});
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("github-mcp error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
