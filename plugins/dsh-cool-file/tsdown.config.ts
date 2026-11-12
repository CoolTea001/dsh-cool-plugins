import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-file'

export default dshPlugin({
  packageId: PACKAGE_ID,
  // The tokenizer's grammars are the bulk of this bundle, and they are data:
  // minifying costs nothing debuggable at runtime and trims the code around
  // them.
  clientMinify: true,
  // Everything is inlined on purpose: the page never resolves a package that is
  // not a shell seed, so a runtime `require('shiki')` would fail and the preview
  // would lose its colours. The allowlist check is off because Shiki's
  // transitive packages are its implementation detail, not dependencies this
  // package should enumerate.
  quietBundledDeps: true,
})
