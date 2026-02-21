/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Циклические зависимости запрещены",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Файлы-сироты (не используются нигде)",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$", // dot files
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$",
        ],
      },
      to: {},
    },
    {
      name: "no-barrel-exports-in-ui",
      severity: "error",
      comment:
        "Запрещены barrel exports в UI пакете (создают циклические зависимости)",
      from: {
        path: "packages/ui/src/components/.*\\.tsx?$",
      },
      to: {
        path: "packages/ui/src/components/index\\.ts$",
      },
    },
    {
      name: "enforce-layer-architecture",
      severity: "error",
      comment:
        "Нарушение слоистой архитектуры: верхние слои не могут импортировать из нижних",
      from: {
        path: "^packages/(types|validators|config)",
      },
      to: {
        path: "^packages/(db|auth|lib|ai|emails|jobs|integration-clients|api|shared|ui)",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
      archi: {
        collapsePattern: "^(packages|apps)/[^/]+",
      },
    },
  },
};
