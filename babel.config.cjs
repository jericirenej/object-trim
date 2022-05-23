module.exports = function configureBabel(api) {
  api.cache(true);
  const ignore = ["src/tests", "src/helpers"];

  const presets = [
    ["@babel/preset-env", { targets: { node: "14.17.0" }, modules: false }],
    ["@babel/preset-typescript"],
  ];

  const plugins = [
    ["babel-plugin-add-import-extension", { extension: "mjs", replace: true }],
  ];
  return { presets, plugins, ignore };
};
