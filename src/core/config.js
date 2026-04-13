const KIBS_STACK = {
  frontend: "react-tailwind",
  backend: "express",
  database: "mysql",
  auth: "session",
};

const KIBS_FEATURES = {
  crud: true,
  relationships: "simple",
  reports: "simple",
};

function createKibsConfig(projectName) {
  return {
    name: projectName,
    version: 1,
    stack: { ...KIBS_STACK },
    features: { ...KIBS_FEATURES },
  };
}

module.exports = {
  KIBS_STACK,
  KIBS_FEATURES,
  createKibsConfig,
};
