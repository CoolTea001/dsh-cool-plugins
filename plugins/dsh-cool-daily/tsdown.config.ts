import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-daily'

/**
 * The client reads `src/client/assets/*.svg` as source text through tsdown's
 * `.svg` loader, so the artwork is already inside the published `lib/client.js`
 * and the browser fetches nothing.
 */
export default dshPlugin({
  packageId: PACKAGE_ID,
  clientLoader: { '.svg': 'text' },
  clientDefine: {
    // The stylesheet's ownership tag has to name the id the loader registers
    // this bundle under, so the banner and the tag read the one constant.
    __DSH_CD_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
  },
})
