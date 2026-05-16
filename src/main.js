/**
 * Main entry point for coolify-deploy action
 * Flow: disable BFM → deploy → create GitHub deployment → write summary
 */

const core = require('@actions/core');
const github = require('@actions/github');
const cloudflare = require('./cloudflare');
const coolify = require('./coolify');
const deployment = require('./deployment');
const { parseWebhookUrls, sleep, formatSummary } = require('./utils');

async function run() {
  try {
    // 1. Read inputs
    const webhookUrlInput = core.getInput('coolify_webhook_url', { required: true });
    const coolifyToken = core.getInput('coolify_token', { required: true });
    const cfApiToken = core.getInput('cloudflare_api_token');
    const cfZoneId = core.getInput('cloudflare_zone_id');
    const bypassBot = core.getInput('bypass_cloudflare_bot') || 'auto';
    const propagationDelay = parseInt(core.getInput('propagation_delay') || '15', 10);
    const createDeployment = core.getInput('create_github_deployment') === 'true';
    const deploymentEnv = core.getInput('deployment_environment') || 'production';
    const appUrlInput = core.getInput('app_url') || '';
    const githubToken = core.getInput('github_token');

    // 2. Resolve bypass_cloudflare_bot
    const hasCfCreds = cfApiToken && cfZoneId;
    let shouldBypass = false;

    if (bypassBot === 'auto') {
      shouldBypass = !!hasCfCreds;
    } else {
      shouldBypass = bypassBot === 'true';
    }

    // 3. Disable Bot Fight Mode if needed
    let bfmStatus = 'skipped';

    if (shouldBypass) {
      if (!hasCfCreds) {
        core.setFailed('bypass_cloudflare_bot is enabled but cloudflare_api_token or cloudflare_zone_id is missing');
        return;
      }

      core.info('🛡️ Disabling Cloudflare Bot Fight Mode...');
      const originalState = await cloudflare.disable(cfApiToken, cfZoneId);

      // Save state for post.js cleanup
      core.saveState('original_bfm', String(originalState));
      core.saveState('cf_api_token', cfApiToken);
      core.saveState('cf_zone_id', cfZoneId);

      core.info(`✅ Bot Fight Mode disabled (was: ${originalState})`);
      bfmStatus = 'disabled';

      // Wait for propagation
      core.info(`⏳ Waiting ${propagationDelay}s for DNS/CF propagation...`);
      await sleep(propagationDelay);
    } else {
      core.saveState('original_bfm', 'false');
    }

    // 4. Parse webhook URLs and deploy
    const webhookUrls = parseWebhookUrls(webhookUrlInput);
    const totalServices = webhookUrls.length;
    let successCount = 0;

    core.info(`🚀 Deploying ${totalServices} service(s) via Coolify...`);

    for (let i = 0; i < webhookUrls.length; i++) {
      const url = webhookUrls[i];
      const serviceNum = i + 1;

      core.info(`  [${serviceNum}/${totalServices}] Triggering deploy...`);

      const result = await coolify.deploy(url, coolifyToken);

      if (result.success) {
        core.info(`  ✅ [${serviceNum}/${totalServices}] HTTP ${result.httpCode}`);
        successCount++;
      } else {
        core.warning(`  ❌ [${serviceNum}/${totalServices}] HTTP ${result.httpCode}: ${result.body}`);
      }
    }

    const allSuccess = successCount === totalServices;

    // 5. GitHub Deployment
    let deploymentId = null;
    let resolvedAppUrl = '';
    let deploymentStatus = 'skipped';

    if (createDeployment && githubToken) {
      const octokit = github.getOctokit(githubToken);
      const { owner, repo } = github.context.repo;
      const sha = github.context.sha;

      // Resolve app URL
      if (appUrlInput === 'auto') {
        core.info('🔍 Resolving app URL from Coolify API...');
        resolvedAppUrl = await coolify.resolveAppUrl(webhookUrls[0], coolifyToken);
        if (resolvedAppUrl) {
          core.info(`  ✅ Resolved: ${resolvedAppUrl}`);
        } else {
          core.warning('  ⚠️ Could not resolve app URL from Coolify API');
        }
      } else if (appUrlInput) {
        resolvedAppUrl = appUrlInput;
      }

      // Create deployment
      core.info('📦 Creating GitHub Deployment...');
      deploymentId = await deployment.create(octokit, {
        owner,
        repo,
        sha,
        environment: deploymentEnv,
        description: `Coolify deploy (${successCount}/${totalServices} services)`,
      });

      // Set deployment status
      const state = allSuccess ? 'success' : 'failure';
      await deployment.setStatus(octokit, {
        owner,
        repo,
        deploymentId,
        state,
        description: `${successCount}/${totalServices} services deployed`,
        environmentUrl: resolvedAppUrl || undefined,
      });

      deploymentStatus = `created (#${deploymentId})`;
      core.info(`  ✅ Deployment #${deploymentId} → ${state}`);
    }

    // 6. Write step summary
    const summary = formatSummary({
      services: totalServices,
      successCount,
      bfm: bfmStatus,
      deployment: deploymentStatus,
      appUrl: resolvedAppUrl,
      sha: github.context.sha,
      actor: github.context.actor,
    });

    await core.summary.addRaw(summary).write();

    // 7. Set outputs
    core.setOutput('deployment_status', allSuccess ? 'success' : 'failure');
    core.setOutput('deployed_services', String(successCount));
    core.setOutput('bot_mode_restored', 'pending');
    core.setOutput('github_deployment_id', deploymentId ? String(deploymentId) : '');
    core.setOutput('resolved_app_url', resolvedAppUrl || '');

    // Fail the action if not all services deployed
    if (!allSuccess) {
      core.setFailed(`Only ${successCount}/${totalServices} services deployed successfully`);
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
