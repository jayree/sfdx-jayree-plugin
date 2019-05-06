# [1.3.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.2.1...v1.3.0) (2019-05-06)


### Features

* respect SfdxProjectJson configuration ([cfde517](https://github.com/jayree/sfdx-jayree-plugin/commit/cfde517))

## [1.2.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.2.0...v1.2.1) (2019-05-05)


### Bug Fixes

* include CustomObjectTranslation for Product ([816402d](https://github.com/jayree/sfdx-jayree-plugin/commit/816402d))
* update dependencies ([43cb6f4](https://github.com/jayree/sfdx-jayree-plugin/commit/43cb6f4))
* **ltngsyncstatus:** align automation command tree ([9db2b65](https://github.com/jayree/sfdx-jayree-plugin/commit/9db2b65))

# [1.2.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.1.2...v1.2.0) (2019-04-08)


### Bug Fixes

* fix ECONNRESET error ([2bd714e](https://github.com/jayree/sfdx-jayree-plugin/commit/2bd714e))
* update dependencies ([1b3023b](https://github.com/jayree/sfdx-jayree-plugin/commit/1b3023b))


### Features

* add statecountry:create command ([cbebccb](https://github.com/jayree/sfdx-jayree-plugin/commit/cbebccb))

## [1.1.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.1.1...v1.1.2) (2019-03-29)


### Bug Fixes

* update dependencies ([c323ad0](https://github.com/jayree/sfdx-jayree-plugin/commit/c323ad0))

## [1.1.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.1.0...v1.1.1) (2019-03-28)


### Bug Fixes

* update dependencies ([e026a47](https://github.com/jayree/sfdx-jayree-plugin/commit/e026a47))
* **automation:** align flag behaviour with upcomming changes ([c92b333](https://github.com/jayree/sfdx-jayree-plugin/commit/c92b333))
* **ltngsyncstatus:** align flag behaviour with upcomming changes ([feaab03](https://github.com/jayree/sfdx-jayree-plugin/commit/feaab03))
* **packagexml:** not exclude content of pkgs with excludemanaged flag ([629fa51](https://github.com/jayree/sfdx-jayree-plugin/commit/629fa51))
* **scratchorg:** align flag behaviour with upcomming changes ([8673210](https://github.com/jayree/sfdx-jayree-plugin/commit/8673210))

# [1.1.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.0.0...v1.1.0) (2019-03-11)


### Bug Fixes

* **packagexml:** fix ENOTFOUND error and PersonAccount references ([7512cf1](https://github.com/jayree/sfdx-jayree-plugin/commit/7512cf1))


### Features

* **scratchorg:** enhance revision command ([#66](https://github.com/jayree/sfdx-jayree-plugin/issues/66)) ([7c86d35](https://github.com/jayree/sfdx-jayree-plugin/commit/7c86d35))

# [1.0.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.7.0...v1.0.0) (2019-02-27)


### Bug Fixes

* update dependencies ([0713bac](https://github.com/jayree/sfdx-jayree-plugin/commit/0713bac))


### Features

* **scratchorg:** add scratchorg topic ([7f19264](https://github.com/jayree/sfdx-jayree-plugin/commit/7f19264))
* **scratchorgrevision:** add scratchorgrevision command ([#64](https://github.com/jayree/sfdx-jayree-plugin/issues/64)) ([c7ba5b8](https://github.com/jayree/sfdx-jayree-plugin/commit/c7ba5b8))


### BREAKING CHANGES

* **scratchorg:** The scratch org commands have been moved to the new scratchorg topic

# [0.7.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.6.1...v0.7.0) (2019-02-17)


### Bug Fixes

* update dependencies ([c9eda0b](https://github.com/jayree/sfdx-jayree-plugin/commit/c9eda0b))
* **automation:** update puppeteer and other deps ([c91b9a6](https://github.com/jayree/sfdx-jayree-plugin/commit/c91b9a6))
* **ltngsyncstatus:** adjustments due to puppeteer changes ([bcf5c1c](https://github.com/jayree/sfdx-jayree-plugin/commit/bcf5c1c))
* **packagexml:** generate manifest if no InstalledPackages are available ([14e8d8c](https://github.com/jayree/sfdx-jayree-plugin/commit/14e8d8c))


### Features

* **scratchorgsettings:** add scratchorgsettings command ([920e65a](https://github.com/jayree/sfdx-jayree-plugin/commit/920e65a))

## [0.6.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.6.0...v0.6.1) (2019-01-31)


### Bug Fixes

* **packagexml:** exclude namespacePrefix ([3c34675](https://github.com/jayree/sfdx-jayree-plugin/commit/3c34675))

# [0.6.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.5.1...v0.6.0) (2019-01-30)


### Features

* **packagexml:** include only exinsting and valid StandardValueSets ([08a4f2c](https://github.com/jayree/sfdx-jayree-plugin/commit/08a4f2c))

## [0.5.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.5.0...v0.5.1) (2019-01-29)


### Bug Fixes

* remove per-env as dependency to remove git as peer-dependency ([045bb1d](https://github.com/jayree/sfdx-jayree-plugin/commit/045bb1d))

# [0.5.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.8...v0.5.0) (2019-01-24)


### Bug Fixes

* **packagexml:**  add folders to package.xml ([b4a2076](https://github.com/jayree/sfdx-jayree-plugin/commit/b4a2076))
* **packagexml:**  remove FlowDefinition if apiVersion >= 44.0 ([bb7e363](https://github.com/jayree/sfdx-jayree-plugin/commit/bb7e363))
* update dependencies ([e10070e](https://github.com/jayree/sfdx-jayree-plugin/commit/e10070e))


### Features

* **packagexml:**  rename config flag to configfile ([f4c8368](https://github.com/jayree/sfdx-jayree-plugin/commit/f4c8368))

## [0.4.8](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.7...v0.4.8) (2019-01-13)


### Bug Fixes

* **packagexml:**  switch to fs-extra ([a7d56e3](https://github.com/jayree/sfdx-jayree-plugin/commit/a7d56e3))
* **packagexml:**  undefined folderItem ([0811b82](https://github.com/jayree/sfdx-jayree-plugin/commit/0811b82))
* update dependencies ([4adde95](https://github.com/jayree/sfdx-jayree-plugin/commit/4adde95))


### Reverts

* codecov version 3.1.0 ([a02e21f](https://github.com/jayree/sfdx-jayree-plugin/commit/a02e21f))

## [0.4.7](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.6...v0.4.7) (2018-12-22)


### Bug Fixes

* error - mismatched version in plugin manifest ([542ed9f](https://github.com/jayree/sfdx-jayree-plugin/commit/542ed9f))

## [0.4.6](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.5...v0.4.6) (2018-12-22)


### Bug Fixes

* patch dev-cli to create README.md for sfdx ([02bc2c3](https://github.com/jayree/sfdx-jayree-plugin/commit/02bc2c3))

## [0.4.5](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.4...v0.4.5) (2018-12-21)


### Bug Fixes

* update salesforce/command ([21e4685](https://github.com/jayree/sfdx-jayree-plugin/commit/21e4685))

## [0.4.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.3...v0.4.4) (2018-12-21)


### Bug Fixes

* sfdx plugin installation bug ([3cd5ff4](https://github.com/jayree/sfdx-jayree-plugin/commit/3cd5ff4))

## [0.4.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.2...v0.4.3) (2018-12-21)


### Bug Fixes

* update salesforce/core ([7879cb3](https://github.com/jayree/sfdx-jayree-plugin/commit/7879cb3))

## [0.4.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.1...v0.4.2) (2018-12-21)


### Bug Fixes

* update dependencies ([deb95f3](https://github.com/jayree/sfdx-jayree-plugin/commit/deb95f3))

## [0.4.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v0.4.0...v0.4.1) (2018-12-21)


### Bug Fixes

* README.md usage tag ([6a33513](https://github.com/jayree/sfdx-jayree-plugin/commit/6a33513))
