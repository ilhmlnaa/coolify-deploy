/**
 * Utility helpers for coolify-deploy action
 */

/**
 * Parse a Coolify webhook URL into base URL and UUID
 * @param {string} url - Full webhook URL (e.g. https://coolify.example.com/api/v1/deploy?uuid=abc123)
 * @returns {{ baseUrl: string, uuid: string|null }}
 */
function parseWebhookUrl(url) {
  const parsed = new URL(url.trim());
  const uuid = parsed.searchParams.get('uuid');
  const baseUrl = parsed.origin;
  return { baseUrl, uuid };
}

/**
 * Parse multiple webhook URLs from comma/newline separated input
 * @param {string} input - Raw input string
 * @returns {string[]}
 */
function parseWebhookUrls(input) {
  return input
    .split(/[,\n]/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

/**
 * Sleep for a given number of seconds
 * @param {number} seconds
 * @returns {Promise<void>}
 */
function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Format a GitHub Step Summary markdown string
 * @param {object} params
 * @returns {string}
 */
function formatSummary({ services, successCount, bfm, deployment, appUrl, sha, actor }) {
  const lines = [
    '## 🚀 Coolify Deploy Summary',
    '',
    '| Item | Value |',
    '|------|-------|',
    `| **Actor** | @${actor} |`,
    `| **Commit** | \`${sha.substring(0, 7)}\` |`,
    `| **Services Deployed** | ${successCount}/${services} |`,
    `| **Bot Fight Mode** | ${bfm} |`,
    `| **GitHub Deployment** | ${deployment} |`,
  ];

  if (appUrl) {
    lines.push(`| **App URL** | [${appUrl}](${appUrl}) |`);
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  parseWebhookUrl,
  parseWebhookUrls,
  sleep,
  formatSummary,
};
