module.exports = {
  files: ["tests/**/*.test.ts"],
  extensions: ["ts"],
  require: ["esbuild-register", "./tests/setup.ts"],
  ignoredByWatcher: [".next", ".nsm"],
}
