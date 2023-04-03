module.exports = {
  files: ["tests/**/*.test.ts"],
  extensions: ["ts"],
  require: ["esbuild-register"],
  ignoredByWatcher: [".next", ".nsm"],
}
