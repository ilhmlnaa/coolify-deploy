/**
 * Cloudflare Bot Fight Mode management
 */

const { HttpClient } = require('@actions/http-client');

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Get current Bot Fight Mode status
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Cloudflare Zone ID
 * @returns {Promise<boolean>} Current fight_mode state
 */
async function getBotFightMode(apiToken, zoneId) {
  const client = new HttpClient('coolify-deploy-action');
  const url = `${CF_API_BASE}/zones/${zoneId}/bot_management`;

  const response = await client.get(url, {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  });

  const body = JSON.parse(await response.readBody());

  if (!body.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(body.errors)}`);
  }

  return body.result.fight_mode;
}

/**
 * Disable Bot Fight Mode and return the original state
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Cloudflare Zone ID
 * @returns {Promise<boolean>} Original fight_mode state before disabling
 */
async function disable(apiToken, zoneId) {
  const originalState = await getBotFightMode(apiToken, zoneId);

  const client = new HttpClient('coolify-deploy-action');
  const url = `${CF_API_BASE}/zones/${zoneId}/bot_management`;

  const response = await client.put(
    url,
    JSON.stringify({ fight_mode: false }),
    {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    }
  );

  const body = JSON.parse(await response.readBody());

  if (!body.success) {
    throw new Error(`Failed to disable Bot Fight Mode: ${JSON.stringify(body.errors)}`);
  }

  return originalState;
}

/**
 * Enable Bot Fight Mode
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Cloudflare Zone ID
 * @returns {Promise<boolean>} Success status
 */
async function enable(apiToken, zoneId) {
  const client = new HttpClient('coolify-deploy-action');
  const url = `${CF_API_BASE}/zones/${zoneId}/bot_management`;

  const response = await client.put(
    url,
    JSON.stringify({ fight_mode: true }),
    {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    }
  );

  const body = JSON.parse(await response.readBody());

  if (!body.success) {
    throw new Error(`Failed to enable Bot Fight Mode: ${JSON.stringify(body.errors)}`);
  }

  return true;
}

module.exports = {
  getBotFightMode,
  disable,
  enable,
};
