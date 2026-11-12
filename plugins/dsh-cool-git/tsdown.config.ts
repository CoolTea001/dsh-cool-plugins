import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-git'

export default dshPlugin({
  packageId: PACKAGE_ID,
  clientDefine: {
    // The stylesheet's ownership tag has to name the id the loader registers
    // this bundle under, so the banner and the tag read the one constant.
    __DSH_CG_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
  },
})
