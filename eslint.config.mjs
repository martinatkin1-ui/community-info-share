import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "supabase/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
