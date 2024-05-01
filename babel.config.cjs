module.exports = function configureBabel(api) {
  api.cache(true);
  const esModule = process.env.NODE_ENV?.trim() === "esmodule";
  const config = {
    modules: esModule ? false : "cjs",
    extension: esModule ? "mjs" : "cjs",
  };
  const ignore = ["src/tests", "src/helpers"];

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: { node: "14.17.0" },
        modules: config.modules,
      },
    ],
    ["@babel/preset-typescript"],
  ];

  const plugins = [
    [
      "babel-plugin-add-import-extension",
      { extension: config.extension, replace: true },
    ],
  ];
  return { presets, plugins, ignore };
};
