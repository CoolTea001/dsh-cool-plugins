import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-theme'

/**
 * Icons are read as their own source text through tsdown's `.svg` loader, which
 * keeps the published package JavaScript-only: `files` ships `lib`, and the
 * artwork is already inside it by the time the bundle is written.
 */
export default dshPlugin({
  packageId: PACKAGE_ID,
  clientLoader: { '.svg': 'text' },
})
