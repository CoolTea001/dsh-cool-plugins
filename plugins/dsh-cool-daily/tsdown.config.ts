import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-daily'

/**
 * The plugin's client half is bundled by the shared preset. Icons come from
 * `@dsh-cool/icons`, whose components the preset inlines like every other
 * workspace package, so no SVG assets are read here.
 */
export default dshPlugin({
  packageId: PACKAGE_ID,
  clientDefine: {
    // The stylesheet's ownership tag has to name the id the loader registers
    // this bundle under, so the banner and the tag read the one constant.
    __DSH_CD_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
  },
})
