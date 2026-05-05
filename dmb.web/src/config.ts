const apiTarget = (process.env.REACT_APP_DMB_API_TARGET || "local").toLowerCase();

const deploymentApiTargets = new Set([
  "deployment",
  "deploy",
  "production",
  "prod",
]);
const useDeploymentApi = deploymentApiTargets.has(apiTarget);

const localApiUrl =
  process.env.REACT_APP_DMB_API_LOCAL_URL || "http://localhost:5080/api";
const deploymentApiUrl =
  process.env.REACT_APP_DMB_API_DEPLOY_URL ||
  "https://dmbportfolio-api.onrender.com/api";

const envApiUrl = process.env.REACT_APP_DMB_API_BASE_URL;

export const dmbApiConfig = {
  // Backward compatible:
  // 1) REACT_APP_DMB_API_BASE_URL (legacy explicit override)
  // 2) REACT_APP_DMB_API_TARGET=local|deploy|deployment|prod|production (preferred)
  dmb_api_url:
    envApiUrl ||
    (useDeploymentApi ? deploymentApiUrl : localApiUrl),
};
