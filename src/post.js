/**
 * Post-action cleanup for coolify-deploy
 * Re-enables Cloudflare Bot Fight Mode if it was disabled during main
 * Runs ALWAYS (even on failure/cancel) via post-if: always()
 */

const core = require('@actions/core');
const cloudflare = require('./cloudflare');

async function run() {
  try {
    const originalBfm = core.getState('original_bfm');
    const cfApiToken = core.getState('cf_api_token');
    const cfZoneId = core.getState('cf_zone_id');

    // Only re-enable if BFM was originally enabled
    if (originalBfm === 'true' && cfApiToken && cfZoneId) {
      core.info('🛡️ Re-enabling Cloudflare Bot Fight Mode...');

      await cloudflare.enable(cfApiToken, cfZoneId);

      core.info('✅ Bot Fight Mode re-enabled');
      core.setOutput('bot_mode_restored', 'true');
    } else if (originalBfm === 'false' || !originalBfm) {
      core.info('ℹ️ Bot Fight Mode was not originally enabled or bypass was skipped, nothing to restore');
      core.setOutput('bot_mode_restored', 'skipped');
    } else {
      // originalBfm exists but is not 'true' — edge case
      core.info('ℹ️ No Bot Fight Mode restoration needed');
      core.setOutput('bot_mode_restored', 'skipped');
    }
  } catch (error) {
    // Post actions should not fail the workflow, just warn
    core.warning(`Failed to restore Bot Fight Mode: ${error.message}`);
    core.setOutput('bot_mode_restored', 'false');
  }
}

run();
