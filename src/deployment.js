/**
 * GitHub Deployment API helpers
 */

/**
 * Create a GitHub Deployment
 * @param {import('@octokit/rest').Octokit} octokit
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.sha
 * @param {string} params.environment
 * @param {string} [params.description]
 * @returns {Promise<number>} Deployment ID
 */
async function create(octokit, { owner, repo, sha, environment, description }) {
  const { data } = await octokit.rest.repos.createDeployment({
    owner,
    repo,
    ref: sha,
    environment,
    description: description || 'Deployed via Coolify Deploy Action',
    auto_merge: false,
    required_contexts: [],
    transient_environment: false,
    production_environment: environment === 'production',
  });

  return data.id;
}

/**
 * Set deployment status
 * @param {import('@octokit/rest').Octokit} octokit
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.deploymentId
 * @param {string} params.state - 'success' | 'failure' | 'in_progress' | 'queued'
 * @param {string} [params.description]
 * @param {string} [params.environmentUrl]
 * @returns {Promise<void>}
 */
async function setStatus(octokit, { owner, repo, deploymentId, state, description, environmentUrl }) {
  const params = {
    owner,
    repo,
    deployment_id: deploymentId,
    state,
    description: description || `Deployment ${state}`,
  };

  if (environmentUrl) {
    params.environment_url = environmentUrl;
  }

  await octokit.rest.repos.createDeploymentStatus(params);
}

module.exports = {
  create,
  setStatus,
};
