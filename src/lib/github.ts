import { WealthData } from '@/types/wealth';

interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch?: string;
}

interface GitHubFileResponse {
  sha: string;
  content: string;
}

// ── Encoding helpers ─────────────────────────────────────────────────────────
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const cleaned = b64.replace(/\s/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── Demo mode: all GitHub operations are disabled ────────────────────────────

export async function fetchShaOnly(_config: GitHubConfig): Promise<string | null> {
  return null;
}

export async function fetchDataFromGitHub(
  _config: GitHubConfig
): Promise<{ data: WealthData; sha: string }> {
  throw new Error('GitHub sync is disabled in demo mode.');
}

export async function saveDataToGitHub(
  _config: GitHubConfig,
  _data: WealthData,
  _sha: string | null,
  _commitMessage?: string
): Promise<string> {
  throw new Error('GitHub sync is disabled in demo mode.');
}

// ── Demo mode: no GitHub config ──────────────────────────────────────────────

export function getGitHubConfig(): GitHubConfig | null {
  // Always return null in demo mode — forces the app to use local data.json
  return null;
}

export function setGitHubConfig(_config: GitHubConfig): void {
  // no-op in demo mode
}

export function clearGitHubConfig(): void {
  // no-op in demo mode
}
