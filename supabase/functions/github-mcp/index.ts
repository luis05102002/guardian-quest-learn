import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

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

const app = new Hono();

const mcpServer = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

// Tool: List repos for authenticated user
mcpServer.tool({
  name: "list_repos",
  description: "List GitHub repositories for the authenticated user. Optionally filter by type.",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["all", "owner", "public", "private", "member"],
        description: "Type of repos to list (default: owner)",
      },
      per_page: {
        type: "number",
        description: "Number of results per page (max 100, default 30)",
      },
    },
  },
  handler: async ({ type, per_page }: { type?: string; per_page?: number }) => {
    const t = type || "owner";
    const pp = per_page || 30;
    const repos = await ghFetch(`/user/repos?type=${t}&per_page=${pp}&sort=updated`);
    const summary = repos.map((r: any) => ({
      name: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      private: r.private,
      updated_at: r.updated_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  },
});

// Tool: Get repo details
mcpServer.tool({
  name: "get_repo",
  description: "Get details of a specific GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repository owner (user or org)" },
      repo: { type: "string", description: "Repository name" },
    },
    required: ["owner", "repo"],
  },
  handler: async ({ owner, repo }: { owner: string; repo: string }) => {
    const data = await ghFetch(`/repos/${owner}/${repo}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          full_name: data.full_name,
          description: data.description,
          language: data.language,
          stars: data.stargazers_count,
          forks: data.forks_count,
          open_issues: data.open_issues_count,
          default_branch: data.default_branch,
          url: data.html_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
          topics: data.topics,
        }, null, 2),
      }],
    };
  },
});

// Tool: List files in a repo directory
mcpServer.tool({
  name: "list_files",
  description: "List files and directories in a GitHub repository path",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repository owner" },
      repo: { type: "string", description: "Repository name" },
      path: { type: "string", description: "Path within the repo (default: root)" },
      ref: { type: "string", description: "Branch or commit ref (default: main)" },
    },
    required: ["owner", "repo"],
  },
  handler: async ({ owner, repo, path, ref }: { owner: string; repo: string; path?: string; ref?: string }) => {
    const p = path || "";
    const r = ref ? `?ref=${ref}` : "";
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${p}${r}`);
    const files = Array.isArray(data)
      ? data.map((f: any) => ({ name: f.name, type: f.type, size: f.size, path: f.path }))
      : [{ name: data.name, type: data.type, size: data.size, path: data.path }];
    return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
  },
});

// Tool: Read file content
mcpServer.tool({
  name: "read_file",
  description: "Read the content of a file from a GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repository owner" },
      repo: { type: "string", description: "Repository name" },
      path: { type: "string", description: "File path within the repo" },
      ref: { type: "string", description: "Branch or commit ref" },
    },
    required: ["owner", "repo", "path"],
  },
  handler: async ({ owner, repo, path, ref }: { owner: string; repo: string; path: string; ref?: string }) => {
    const r = ref ? `?ref=${ref}` : "";
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${path}${r}`);
    if (data.type !== "file") {
      return { content: [{ type: "text", text: `Error: ${path} is a ${data.type}, not a file` }] };
    }
    const decoded = atob(data.content.replace(/\n/g, ""));
    return { content: [{ type: "text", text: decoded }] };
  },
});

// Tool: List issues
mcpServer.tool({
  name: "list_issues",
  description: "List issues in a GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repository owner" },
      repo: { type: "string", description: "Repository name" },
      state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state filter" },
      per_page: { type: "number", description: "Results per page (max 100)" },
    },
    required: ["owner", "repo"],
  },
  handler: async ({ owner, repo, state, per_page }: { owner: string; repo: string; state?: string; per_page?: number }) => {
    const s = state || "open";
    const pp = per_page || 20;
    const issues = await ghFetch(`/repos/${owner}/${repo}/issues?state=${s}&per_page=${pp}`);
    const summary = issues.map((i: any) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      author: i.user?.login,
      labels: i.labels?.map((l: any) => l.name),
      created_at: i.created_at,
      comments: i.comments,
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  },
});

// Tool: List pull requests
mcpServer.tool({
  name: "list_pull_requests",
  description: "List pull requests in a GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Repository owner" },
      repo: { type: "string", description: "Repository name" },
      state: { type: "string", enum: ["open", "closed", "all"], description: "PR state filter" },
    },
    required: ["owner", "repo"],
  },
  handler: async ({ owner, repo, state }: { owner: string; repo: string; state?: string }) => {
    const s = state || "open";
    const prs = await ghFetch(`/repos/${owner}/${repo}/pulls?state=${s}&per_page=20`);
    const summary = prs.map((p: any) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      author: p.user?.login,
      head: p.head?.ref,
      base: p.base?.ref,
      created_at: p.created_at,
      mergeable_state: p.mergeable_state,
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  },
});

// Tool: Search repos
mcpServer.tool({
  name: "search_repos",
  description: "Search GitHub repositories by query",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (e.g. 'language:python stars:>100')" },
      per_page: { type: "number", description: "Results per page (max 100)" },
    },
    required: ["query"],
  },
  handler: async ({ query, per_page }: { query: string; per_page?: number }) => {
    const pp = per_page || 10;
    const data = await ghFetch(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${pp}`);
    const repos = data.items.map((r: any) => ({
      name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
    }));
    return { content: [{ type: "text", text: JSON.stringify(repos, null, 2) }] };
  },
});

const transport = new StreamableHttpTransport();

// CORS preflight
app.options("/*", (c) => new Response(null, { headers: corsHeaders }));

app.all("/*", async (c) => {
  const response = await transport.handleRequest(c.req.raw, mcpServer);
  // Add CORS headers to response
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, { status: response.status, headers: newHeaders });
});

Deno.serve(app.fetch);
