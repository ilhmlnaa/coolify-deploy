/**
 * Coolify webhook deploy and domain resolver
 */

const { HttpClient } = require("@actions/http-client");
const { parseWebhookUrl } = require("./utils");

/**
 * Trigger a deploy via Coolify webhook
 * @param {string} webhookUrl - Full webhook URL
 * @param {string} token - Coolify API Bearer token
 * @returns {Promise<{ httpCode: number, body: string, success: boolean }>}
 */
async function deploy(webhookUrl, token) {
  const client = new HttpClient("coolify-deploy-action");

  const response = await client.post(webhookUrl, "", {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  });

  const statusCode = response.message.statusCode;
  const body = await response.readBody();
  const success = statusCode >= 200 && statusCode < 300;

  return { httpCode: statusCode, body, success };
}

/**
 * Resolve the app URL from Coolify API using the webhook UUID
 * @param {string} webhookUrl - Full webhook URL (used to extract base URL and UUID)
 * @param {string} token - Coolify API Bearer token
 * @returns {Promise<string|null>} First domain from fqdn field, or null on failure
 */
async function resolveAppUrl(webhookUrl, token) {
  try {
    const { baseUrl, uuid } = parseWebhookUrl(webhookUrl);

    if (!uuid) {
      return null;
    }

    const client = new HttpClient("coolify-deploy-action");
    const url = `${baseUrl}/api/v1/applications/${uuid}`;

    const response = await client.get(url, {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    const statusCode = response.message.statusCode;
    if (statusCode < 200 || statusCode >= 300) {
      return null;
    }

    const body = JSON.parse(await response.readBody());
    const fqdn = body.fqdn;

    if (!fqdn) {
      return null;
    }

    // fqdn can be comma-separated, take the first one
    const firstDomain = fqdn.split(",")[0].trim();
    return firstDomain || null;
  } catch {
    // Non-fatal: return null if resolution fails
    return null;
  }
}

module.exports = {
  deploy,
  resolveAppUrl,
};
