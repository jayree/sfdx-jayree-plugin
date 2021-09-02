## [4.0.6](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.5...v4.0.6) (2021-09-02)


### Bug Fixes

* **gitdiff:** fix windows path handling ([de76079](https://github.com/jayree/sfdx-jayree-plugin/commit/de76079df4155d5e0199fff2956dee4228558ce5))

## [4.0.5](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.4...v4.0.5) (2021-09-02)


### Bug Fixes

* **gitdiff:** fix createVirtualTreeContainer on windows ([7fb6c59](https://github.com/jayree/sfdx-jayree-plugin/commit/7fb6c5988c66a635f0e52632fb1339117dd990a6))

## [4.0.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.3...v4.0.4) (2021-09-01)


### Bug Fixes

* **gitdiff:** use SDR forDestructiveChanges parameter ([e2b69dd](https://github.com/jayree/sfdx-jayree-plugin/commit/e2b69dd479533e9094ceaf0c2fb5ea4000eafa34))
* update dependencies, pin SDR version ([76fd39f](https://github.com/jayree/sfdx-jayree-plugin/commit/76fd39f0ef4fa09dcdf4e1fdfee0d5946e4dcc40))

## [4.0.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.2...v4.0.3) (2021-08-21)


### Bug Fixes

* update dependencies ([6f4b18b](https://github.com/jayree/sfdx-jayree-plugin/commit/6f4b18be647dbaabe7c38ce46d28a67718e2937d))
* **gitdiff:** rename skipped to unchanged ([5a32c97](https://github.com/jayree/sfdx-jayree-plugin/commit/5a32c97f4ddbea1f16a8f1f215cffe369b53633e))
* **gitdiff:** use lazy renderer option to fix sync issues ([495e9fe](https://github.com/jayree/sfdx-jayree-plugin/commit/495e9fedc65d340038e805820c6e082701d5861e))

## [4.0.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.1...v4.0.2) (2021-08-08)


### Bug Fixes

* **git:diff:** update registry, fix skip tasks ([bb74d76](https://github.com/jayree/sfdx-jayree-plugin/commit/bb74d7633c54897f6c164f6888dfe5f17befdde4))

## [4.0.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v4.0.0...v4.0.1) (2021-08-03)


### Bug Fixes

* **git:diff:** fix if process.emitWarning is called ([d0332ba](https://github.com/jayree/sfdx-jayree-plugin/commit/d0332bae087fc49f583be9b0a82ac4f343dba731))
* **manifest:cleanup:** creates cleanup manifest template if file doesn't exist ([b6ae5e0](https://github.com/jayree/sfdx-jayree-plugin/commit/b6ae5e0e152a8fd4112b23274451bf003694b15d))
* **manifest:generate:** fix if targetpath doesn't exist ([49a9937](https://github.com/jayree/sfdx-jayree-plugin/commit/49a9937d7f8ba1376ef9129bdb5a6ee4c2254e8b))

# [4.0.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.12.1...v4.0.0) (2021-08-01)


### Bug Fixes

* **hooks:** fix if result is empty after success filter ([5193185](https://github.com/jayree/sfdx-jayree-plugin/commit/51931851495cf34be61fce8092f8fd6cf68be39f))


### Features

* faster xml processing ([58bda42](https://github.com/jayree/sfdx-jayree-plugin/commit/58bda422aef53cb539ad6680e3b8d94e88037cf7))
* hook support for plugin-source plugin ([fcb840b](https://github.com/jayree/sfdx-jayree-plugin/commit/fcb840b79d49d5739a87781425b98de44e5ce1db))
* new lightning fast version of git:diff based on the  SDR library ([859e676](https://github.com/jayree/sfdx-jayree-plugin/commit/859e6763153ee2676117375b93bb17d474d29bd5))
* remove deprecated commands ([009fd30](https://github.com/jayree/sfdx-jayree-plugin/commit/009fd30f132c6c90b1bd33a36fb237fee2108034))


### BREAKING CHANGES

* remove source:all and :full, as the functionality is replaced by the retrieve hooks

## [3.12.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.12.0...v3.12.1) (2021-07-20)


### Bug Fixes

* update dependencies ([3852efe](https://github.com/jayree/sfdx-jayree-plugin/commit/3852efeb317e03c84a8ce1150635875000f2bc50))
* **sourcefix:** optimize inserttask code and fix object-path bug ([a12b14f](https://github.com/jayree/sfdx-jayree-plugin/commit/a12b14f65d838775704fa2d3322208b74abd54f8))

# [3.12.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.5...v3.12.0) (2021-07-11)


### Bug Fixes

* update dependencies and metadataObjects ([1afd9ff](https://github.com/jayree/sfdx-jayree-plugin/commit/1afd9ff37a6acb546c1c4d9d178dd6f146574253))


### Features

* **hooks:** support plugin-source plugin ([3f1fa64](https://github.com/jayree/sfdx-jayree-plugin/commit/3f1fa640444d48827b09eac0bdd4ca86cba61ef0))

## [3.11.5](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.4...v3.11.5) (2021-06-30)


### Bug Fixes

* **hooks:** call reset in prerun hook if storedServerMaxRevisionCounter eq 0 ([2ffda2c](https://github.com/jayree/sfdx-jayree-plugin/commit/2ffda2c6b9615c3a5937de22e096a587ce831541))
* update listr2 subTasksRenderer ([8733744](https://github.com/jayree/sfdx-jayree-plugin/commit/8733744ffebdecefb43e2ed33d5586b314ca0817))

## [3.11.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.3...v3.11.4) (2021-06-24)


### Bug Fixes

* update dependencies ([b1b7993](https://github.com/jayree/sfdx-jayree-plugin/commit/b1b79934c9d74c373040606976787fe501e4688c))
* **gitdiff:** replace ChildTypes with ParentTypes in manifest where necessary ([4f55a9f](https://github.com/jayree/sfdx-jayree-plugin/commit/4f55a9f9259032d61e9ed51d08c6937496e41a3e))
* **packagedescription:** remove xml-js dependency ([0e93b99](https://github.com/jayree/sfdx-jayree-plugin/commit/0e93b996fe0587080b33115c4b90e2d1c5bd3d81))

## [3.11.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.2...v3.11.3) (2021-06-18)


### Bug Fixes

* updated dependencies ([0469cf6](https://github.com/jayree/sfdx-jayree-plugin/commit/0469cf6030b577a55421aa8e4252444705bd6ffc))
* **manifestgenerate:** update list of StandardValueSet to match apiVersion ([b808a80](https://github.com/jayree/sfdx-jayree-plugin/commit/b808a807380a2922d600c9312fed596227e7d10c))

## [3.11.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.1...v3.11.2) (2021-06-13)


### Bug Fixes

* add warning message for deprecated commands ([d3bd905](https://github.com/jayree/sfdx-jayree-plugin/commit/d3bd9059fb2186928b736d6c8d28bde8582981c8))

## [3.11.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.11.0...v3.11.1) (2021-06-09)


### Bug Fixes

* **gitdiff:** add missing describe.json file ([6f968f1](https://github.com/jayree/sfdx-jayree-plugin/commit/6f968f1df783841d6cc7c7b362d2e8a86c21f737))

# [3.11.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.10.2...v3.11.0) (2021-06-09)


### Bug Fixes

* **gitdiff:** update describe.json to match apiVersion ([7d94782](https://github.com/jayree/sfdx-jayree-plugin/commit/7d94782bb1e5598772a9f36762cf2b9c4405bd0f))


### Features

* include @jayree/sfdx-plugin-prettier ([2f782b9](https://github.com/jayree/sfdx-jayree-plugin/commit/2f782b9630aa77744f69b16e4592d4f1f0db5a8e))

## [3.10.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.10.1...v3.10.2) (2021-06-08)


### Bug Fixes

* add warning message for deprecated aliases ([755bf8d](https://github.com/jayree/sfdx-jayree-plugin/commit/755bf8dfba9890e7eac87fda4bcebc39078162b7))
* update dependencies ([c4970aa](https://github.com/jayree/sfdx-jayree-plugin/commit/c4970aa0cc22cc01b4a5c8026de6c336bb344bde))

## [3.10.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.10.0...v3.10.1) (2021-05-25)


### Bug Fixes

* update dependencies ([b8510ea](https://github.com/jayree/sfdx-jayree-plugin/commit/b8510eae1d474ffda1cee7227eedb47e62226151))

# [3.10.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.9.1...v3.10.0) (2021-05-22)


### Bug Fixes

* update dependencies ([e2591b7](https://github.com/jayree/sfdx-jayree-plugin/commit/e2591b77850e8ddb6226bf54b259ea8bf955ead1))


### Features

* **org:open:** support edge browser ([cb109e9](https://github.com/jayree/sfdx-jayree-plugin/commit/cb109e99ce66816b494249a6c714def97bc2a529))

## [3.9.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.9.0...v3.9.1) (2021-05-17)


### Bug Fixes

* puppeteer exec in docker ([49581c0](https://github.com/jayree/sfdx-jayree-plugin/commit/49581c0f2bf1c02b1b54fec2bcd891bda1e906b4))
* update dependencies ([7f1d150](https://github.com/jayree/sfdx-jayree-plugin/commit/7f1d15076f805fffb0989db2a6ec79d045a668e6))

# [3.9.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.8.4...v3.9.0) (2021-05-09)


### Bug Fixes

* update dependencies ([65f7412](https://github.com/jayree/sfdx-jayree-plugin/commit/65f7412ceb2ed1d4fcbbe572c91b362303fe2ea6))


### Features

* hide/deprecate jayree:scratchorg:revision ([0b439c4](https://github.com/jayree/sfdx-jayree-plugin/commit/0b439c452f1786957e5debcc69dc8c4e2e937101))
* hide/deprecate jayree:source:retrieve:all ([3a81e40](https://github.com/jayree/sfdx-jayree-plugin/commit/3a81e40ee744a9386220f37807bd1634690df5a5))
* hide/deprecate jayree:source:retrieve:full ([a4cb727](https://github.com/jayree/sfdx-jayree-plugin/commit/a4cb727fc1678babf4bcda49b61e862d262d6832))

## [3.8.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.8.3...v3.8.4) (2021-04-20)


### Bug Fixes

* fix plugin installation ([99c953e](https://github.com/jayree/sfdx-jayree-plugin/commit/99c953ec638421c564eab900219e30bb5fafc3ea))

## [3.8.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.8.2...v3.8.3) (2021-04-19)


### Reverts

* Revert "chore: remove semantic-release" ([679a4e6](https://github.com/jayree/sfdx-jayree-plugin/commit/679a4e6c499e6b3c67e3c65172bf608f6ebceb02))

## [3.8.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.8.1...v3.8.2) (2021-04-19)


### Bug Fixes

* fix prerun hook and update README ([fe21355](https://github.com/jayree/sfdx-jayree-plugin/commit/fe21355e5cfb3cb51c4b5b3362bc4e7a61ac390b))
* update dependencies ([41f5c60](https://github.com/jayree/sfdx-jayree-plugin/commit/41f5c60d9526244e1d8e44d0982e44d40f477f96))

## [3.8.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.8.0...v3.8.1) (2021-04-06)


### Bug Fixes

* fix build and update dependencies ([9466d32](https://github.com/jayree/sfdx-jayree-plugin/commit/9466d32a3e1526d7c780ca6c7b8dee586a463bce))
* fix SFDX_DISABLE_JAYREE_HOOKS=true ([8e0a40f](https://github.com/jayree/sfdx-jayree-plugin/commit/8e0a40f60b78d728cf98c47d78eabd39e6dbfe8e))

# [3.8.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.7.1...v3.8.0) (2021-03-29)


### Bug Fixes

* update dependencies ([226d0d0](https://github.com/jayree/sfdx-jayree-plugin/commit/226d0d09ad5343dce8c3749211cd2380a72ae616))
* **hooks:** fix prettierFormat call ([ab29da5](https://github.com/jayree/sfdx-jayree-plugin/commit/ab29da5188faadf798713379b2d4faadc5247062))
* **hooks:** support mutingpermissionsets ([c329deb](https://github.com/jayree/sfdx-jayree-plugin/commit/c329deba97a8c912d1d377b3a0ccf6fa3480ee9c))
* **orgconfigure:** fix click type 'list' ([f276525](https://github.com/jayree/sfdx-jayree-plugin/commit/f27652537b59f50f3d724aa7e264951b1fe347b9))
* **sourcefix:** bugfix and add debug ([c7301fc](https://github.com/jayree/sfdx-jayree-plugin/commit/c7301fc1f9afcc8e76cc5bc6714d83cdff12f1ca))
* **trackinglist:** start list at storedServerMaxRevisionCounter if available ([eda8607](https://github.com/jayree/sfdx-jayree-plugin/commit/eda86077be378d62d768755bcf66742d424e99c6))


### Features

* add hook to reset source tracking before pull ([2562d37](https://github.com/jayree/sfdx-jayree-plugin/commit/2562d37dc6f8539a7349a217c2a4a0b9646a9af9))
* **orgconfigure:** add action 'type' ([e145dbb](https://github.com/jayree/sfdx-jayree-plugin/commit/e145dbb2a3c5fa4d0eea8138c51b9f43c994d282))
* **orgconfigure:** prepare to support subtasks ([6efb36b](https://github.com/jayree/sfdx-jayree-plugin/commit/6efb36be943f43128816b38ce42205798e2cb723))

## [3.7.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.7.0...v3.7.1) (2021-03-16)


### Bug Fixes

* **gitdiff:** add handler for error - no matching source was found ([6a0557a](https://github.com/jayree/sfdx-jayree-plugin/commit/6a0557aea050e1cf45612ff08007c6b3dce0b272))
* **sourcefix:** allow globby path for file delete ([b3ff0ad](https://github.com/jayree/sfdx-jayree-plugin/commit/b3ff0ada6da83d89fdd268efdfe8635bc9f28bed))

# [3.7.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.6.0...v3.7.0) (2021-03-15)


### Bug Fixes

* update dependencies ([dab9ab4](https://github.com/jayree/sfdx-jayree-plugin/commit/dab9ab47f1e8616aff97907ccbab6ed05a0bb05a))


### Features

* **manifestcleanup:** use exclamation mark to add members to the package manifest ([090f9cd](https://github.com/jayree/sfdx-jayree-plugin/commit/090f9cd382d998f1c4b4f0c38aa0a6c2fe9ee3e3))
* **sourcefix:** set global order of execution to move, modify, delete ([0f3cb7f](https://github.com/jayree/sfdx-jayree-plugin/commit/0f3cb7f6a5c84b857541e6ababfb675d1082ae6d))

# [3.6.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.5.2...v3.6.0) (2021-03-08)


### Bug Fixes

* update dependencies ([4f2fcd2](https://github.com/jayree/sfdx-jayree-plugin/commit/4f2fcd2f2fd9a8c46ab07fae02e3cb65cf1ecd6d))


### Features

* **hooks:** add json output, see README for details ([3ce1e06](https://github.com/jayree/sfdx-jayree-plugin/commit/3ce1e0640d7e4dacf12463bc5ad6fdac89dc9a0c))
* **sourcefix:** add file move function, see example configuration for details ([05b42f5](https://github.com/jayree/sfdx-jayree-plugin/commit/05b42f5201c73f82542ecf4408e439cbe1908663))

## [3.5.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.5.1...v3.5.2) (2021-03-04)


### Bug Fixes

* fix build and update dependencies ([527004f](https://github.com/jayree/sfdx-jayree-plugin/commit/527004f250f5ad74582846c8e164db156674a958))

## [3.5.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.5.0...v3.5.1) (2021-02-25)


### Bug Fixes

* updated dependencies ([ef63825](https://github.com/jayree/sfdx-jayree-plugin/commit/ef63825125d51d9b85f1ad0146fa8982b9652df9))

# [3.5.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.4.3...v3.5.0) (2021-02-20)


### Bug Fixes

* update describe.json to ApiVersion 51.0 ([1c03cc8](https://github.com/jayree/sfdx-jayree-plugin/commit/1c03cc84184386cd14eeebb1f5a76a99b10dd788))
* **hooks:** fix ensureObjectPermissions if no objects are retrieved ([3a7f83c](https://github.com/jayree/sfdx-jayree-plugin/commit/3a7f83cf8da2b2c534d2299f0e297841947a2618))
* update dependencies ([e83f4f1](https://github.com/jayree/sfdx-jayree-plugin/commit/e83f4f1a71dedb076856ae95bd93a058adfca351))
* **sourcetracking:** show and use RevisionCounter and RevisionNum ([f075067](https://github.com/jayree/sfdx-jayree-plugin/commit/f0750674b93256129dc3ec3528baad167f27ad85))


### Features

* added hook documentation to README ([129d0df](https://github.com/jayree/sfdx-jayree-plugin/commit/129d0df7dad8ae397b1afad92f6ab9203529aa07))

## [3.4.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.4.2...v3.4.3) (2021-02-01)


### Bug Fixes

* update dependencies ([dcbcb48](https://github.com/jayree/sfdx-jayree-plugin/commit/dcbcb486bb6dd91b84c8ca30b10d79ae85827fb6))
* **manifestcleanup:** set requiresUsername to false ([ecb06f0](https://github.com/jayree/sfdx-jayree-plugin/commit/ecb06f05cb570e8ef1744570113acb4ad55b8ae7))
* **trackingset:** set  maxRev to 0 if undefined in org ([74bfecd](https://github.com/jayree/sfdx-jayree-plugin/commit/74bfecd0547100b136daf97233e3abf315f44417))

## [3.4.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.4.1...v3.4.2) (2021-01-17)


### Bug Fixes

* update dependencies ([5609a4b](https://github.com/jayree/sfdx-jayree-plugin/commit/5609a4b788b26c331cb8de12b77a32a3b7746a88))
* **sourcetrackinglist:** show stored RevisionCounter only if available ([13baee8](https://github.com/jayree/sfdx-jayree-plugin/commit/13baee8dba68d9f4a8d3a6124ee6600874ec90e1))

## [3.4.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.4.0...v3.4.1) (2021-01-06)


### Bug Fixes

* **sourcefix:** fix win32 path handling ([21e296a](https://github.com/jayree/sfdx-jayree-plugin/commit/21e296ae09241f8486a919d81332276b06445cb6))

# [3.4.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.3.0...v3.4.0) (2021-01-05)


### Bug Fixes

* **sourcefix:** change requiresUsername to supportsUsername ([7890c09](https://github.com/jayree/sfdx-jayree-plugin/commit/7890c09c8301b5a4ff8a9280f0b7d9d02ef7e6ab))
* set version to 50.0 in all internal manifests ([53b9ef6](https://github.com/jayree/sfdx-jayree-plugin/commit/53b9ef6686352a40df01db716b0e511bf1117307))


### Features

* implement retrieve hooks ([dd71f69](https://github.com/jayree/sfdx-jayree-plugin/commit/dd71f6940390b9466b1f222a9558eac0762f5893))

# [3.3.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.6...v3.3.0) (2021-01-04)


### Bug Fixes

* fix changelog hook ([64d2d1d](https://github.com/jayree/sfdx-jayree-plugin/commit/64d2d1dc89ec284448f681b3372364c9b1bbd290))
* update dependencies ([7a2c047](https://github.com/jayree/sfdx-jayree-plugin/commit/7a2c04782f2324b617257a8d04cd630d786ef9b0))


### Features

* rename jayree:scratchorg:settings to jayree:org:settings ([b5d4feb](https://github.com/jayree/sfdx-jayree-plugin/commit/b5d4febe6477bd4a3e603ca2124317ef48823f41))
* split scratchorg:revision into source:tracking:list and :store:get, :store:set ([9e10c6b](https://github.com/jayree/sfdx-jayree-plugin/commit/9e10c6bfaf95adeeabfa553579452f1156b2b58f))

## [3.2.6](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.5...v3.2.6) (2020-12-17)


### Bug Fixes

* **scratchorgrevision:** fix storerevision ([1a05e1c](https://github.com/jayree/sfdx-jayree-plugin/commit/1a05e1c03a3cb688b52bb01fb0d6566bdebed4e8))

## [3.2.5](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.4...v3.2.5) (2020-12-17)


### Bug Fixes

* **gitdiff:** add MissingComponentOrResource handler, fix win32 path handling ([27f5613](https://github.com/jayree/sfdx-jayree-plugin/commit/27f561320637348bd53e44cee2a9aea49007633f))
* **manifestgenerate:** add missing StandardValueSet QuantityUnitOfMeasure ([6380de6](https://github.com/jayree/sfdx-jayree-plugin/commit/6380de678f490c142e849e8a9805815d55146e5b))

## [3.2.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.3...v3.2.4) (2020-12-15)


### Bug Fixes

* **sourceretrievefull:** fix win32 path handling ([a45fd47](https://github.com/jayree/sfdx-jayree-plugin/commit/a45fd47364df279f2f170408ec95016e22f73449))

## [3.2.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.2...v3.2.3) (2020-12-15)


### Bug Fixes

* **sourceretrievefull:** remove console.log ([822d2ab](https://github.com/jayree/sfdx-jayree-plugin/commit/822d2ab7015b130288d01c19e6222501983cc7e7))

## [3.2.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.1...v3.2.2) (2020-12-11)


### Bug Fixes

* error handling on windows ([12566f4](https://github.com/jayree/sfdx-jayree-plugin/commit/12566f4e93091331c1a3f1fde8e0a3497019ca58))
* update dependencies ([5f10c13](https://github.com/jayree/sfdx-jayree-plugin/commit/5f10c136e2fc3a5b9f28b73f6c636990beaee326))

## [3.2.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.2.0...v3.2.1) (2020-12-09)


### Bug Fixes

* replace shelljs with execa and update dependencies ([0d161ff](https://github.com/jayree/sfdx-jayree-plugin/commit/0d161ff8879fea6ba100883dab44714c88115c8e))

# [3.2.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.1.0...v3.2.0) (2020-11-30)


### Bug Fixes

* **gitdiff:** fix error handling ([1c59ce3](https://github.com/jayree/sfdx-jayree-plugin/commit/1c59ce3bb03b6601bd8a7a6482af29e4f9908cef))
* **orgconfigure:** replaced output with skipped if task was already executed ([eb58b1c](https://github.com/jayree/sfdx-jayree-plugin/commit/eb58b1ce039f29874e3ab76d3f62000cc6072597))


### Features

* **sourceretrieve:** added logic to shrink PermissionSets, updated CustomObjects, use tmp project ([34bf807](https://github.com/jayree/sfdx-jayree-plugin/commit/34bf80762f823cd345d7a073d038d04c681ed3f3))
* **sourceretrieve:** new options for ObjectPathResolver ([048ff3d](https://github.com/jayree/sfdx-jayree-plugin/commit/048ff3d68d90bfda1d8882cde43f4778b022aeec))
* **statecountry:** redesigned import command with better output and task parallelization ([88512e3](https://github.com/jayree/sfdx-jayree-plugin/commit/88512e3327d841c2ee90780a0777169cdf0b8ac5))

# [3.1.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.0.1...v3.1.0) (2020-10-26)


### Bug Fixes

* update dependencies ([91472df](https://github.com/jayree/sfdx-jayree-plugin/commit/91472dfab70332510b9dd5a2261f7b2f387a2c81))
* **orgconfigure:** do not require sfdx project ([56b8620](https://github.com/jayree/sfdx-jayree-plugin/commit/56b8620973fb9498002725f5bfe80557296f5652))
* **scratchorgrevision:** always use json format for maxRevision.json ([9e111fd](https://github.com/jayree/sfdx-jayree-plugin/commit/9e111fd762ee86b63a475772492de8538d258f4e))
* **sourcefix:** fix json output ([661b921](https://github.com/jayree/sfdx-jayree-plugin/commit/661b921217fe6668a9495c9138b6b6a1dc9ae2be))
* **sourcefix:** fix source:fix on windows ([a35b614](https://github.com/jayree/sfdx-jayree-plugin/commit/a35b6143da995fc59c4a57568833c5ff64f1f523))
* fix if the configuration file is not present (ENOENT) ([5bb933e](https://github.com/jayree/sfdx-jayree-plugin/commit/5bb933eb0743b701e4f689313c8f14ad652e82c3))
* puppeteer waitFor is deprecated ([4bef674](https://github.com/jayree/sfdx-jayree-plugin/commit/4bef67401289afddabc56d42e6172fa802131222))
* update dependencies ([fbc9a36](https://github.com/jayree/sfdx-jayree-plugin/commit/fbc9a366d14b58069a12f48cb288669bbbc4f0ec))


### Features

* winter ’21 updates ([3771f6e](https://github.com/jayree/sfdx-jayree-plugin/commit/3771f6ee563ad2f2ea10ab6e2992eae0523bc631))

## [3.0.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v3.0.0...v3.0.1) (2020-09-21)


### Bug Fixes

* ensureObjectPermissions bugfix ([516ff87](https://github.com/jayree/sfdx-jayree-plugin/commit/516ff877a58d2615788d56a3b83b076d2220816e))
* update dependencies, add execa ([2330a06](https://github.com/jayree/sfdx-jayree-plugin/commit/2330a06c6a6d6906ffcf43313bea0f0ac0cc4815))

# [3.0.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.2.1...v3.0.0) (2020-09-14)


### Features

* new cmd 'org:configure' to make configuration changes that are not covered by the metadata API ([87f5c19](https://github.com/jayree/sfdx-jayree-plugin/commit/87f5c199da5398fba6f1908352d8d31f7a88baaa))
* **sourceretrieve*:** new way to ensure Object- and UserPermissions in retrieved profiles ([ac69916](https://github.com/jayree/sfdx-jayree-plugin/commit/ac6991632c96b9558cf7d1f4dcc84be00fd95394))


### BREAKING CHANGES

* **sourceretrieve*:** changed result of 'retrieve:all/full' see the example config for more information

## [2.2.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.2.0...v2.2.1) (2020-09-05)


### Bug Fixes

* chalk[color] is not a function ([be5a38f](https://github.com/jayree/sfdx-jayree-plugin/commit/be5a38f13972b8fac30473d490a281cf729b747a))
* update dependencies ([ae5beb7](https://github.com/jayree/sfdx-jayree-plugin/commit/ae5beb796ac7a39a194840c8a4714e9a6a0be8eb))

# [2.2.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.1.3...v2.2.0) (2020-09-04)


### Bug Fixes

* update dependencies ([b8239aa](https://github.com/jayree/sfdx-jayree-plugin/commit/b8239aae5c9ae19fe2914318af7063e89b8c9b1c))


### Features

* new cmd 'jayree:manifest:git:diff' creates manifest and destructiveChanges manifest using git ([56402ad](https://github.com/jayree/sfdx-jayree-plugin/commit/56402adcf3978d8ef2f0b34cb78b0d867870ab2c))

## [2.1.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.1.2...v2.1.3) (2020-08-27)


### Bug Fixes

* revert "fix(sourcefix): do not require username" ([7b5f641](https://github.com/jayree/sfdx-jayree-plugin/commit/7b5f641495ff2b1e5ab929509980fd1b83bd997b))

## [2.1.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.1.1...v2.1.2) (2020-08-27)


### Bug Fixes

* update dependencies ([c34ab8e](https://github.com/jayree/sfdx-jayree-plugin/commit/c34ab8e6209452093d4dd48a6785e13f176a34b3))
* **scratchorgrevision:** show all revision numbers or counters ([a1aeb48](https://github.com/jayree/sfdx-jayree-plugin/commit/a1aeb4881e8762ed62d2f0b3a62697184962f6a0))
* **sourcefix:** do not require username ([c990e3e](https://github.com/jayree/sfdx-jayree-plugin/commit/c990e3e0f6af8c64caaf629a39c5d14c0f5d39ef))
* **sourceretrieve*:** prepare for hooks and optimize runtime ([8b916c3](https://github.com/jayree/sfdx-jayree-plugin/commit/8b916c3b5ecef510f6d2acf15e5f0a0cdc7264ce))
* updated dependencies switch to eslint ([098ce88](https://github.com/jayree/sfdx-jayree-plugin/commit/098ce886e2cc69491708a049c3ea0ffc9bc4d76e))

## [2.1.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.1.0...v2.1.1) (2020-07-20)


### Bug Fixes

* updated dependencies ([3544710](https://github.com/jayree/sfdx-jayree-plugin/commit/354471091e09d816f552d03145efe20c438ccba2))
* **scratchorgsettings:** sfdx project version detection ([5efed34](https://github.com/jayree/sfdx-jayree-plugin/commit/5efed3444b0b77e7b81cf0c932e97d5af11e6990))
* **sourcefix:** find all occurrences matching the search path ([eadfc0c](https://github.com/jayree/sfdx-jayree-plugin/commit/eadfc0cc16448bf2bac422f8d7aa4c0db5d16db2))

# [2.1.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.0.1...v2.1.0) (2020-07-16)


### Bug Fixes

* updated dependencies ([e3c1c65](https://github.com/jayree/sfdx-jayree-plugin/commit/e3c1c65928cdb7e397e07d4f4ca7dd204bc3dc82))


### Features

* **sourcefix:** new path format ([a72ca20](https://github.com/jayree/sfdx-jayree-plugin/commit/a72ca209e382b1a9327b7f073623a8e897fd5fa0))

## [2.0.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v2.0.0...v2.0.1) (2020-07-06)


### Bug Fixes

* **scratchorgrevision:** fix local maxrevision for new json format ([5fc6c00](https://github.com/jayree/sfdx-jayree-plugin/commit/5fc6c002203ae136719fdace1afc8783455edec5))
* update dependencies ([40cce82](https://github.com/jayree/sfdx-jayree-plugin/commit/40cce82b83fad486deac94bb8cc4338c3a4807fa))

# [2.0.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.11.0...v2.0.0) (2020-06-29)


### Bug Fixes

* update dependencies ([386a63c](https://github.com/jayree/sfdx-jayree-plugin/commit/386a63c9727c30811ef79d5a687472cbcd94aa71))


### Features

* added hidden version command for CI use cases ([f2b384d](https://github.com/jayree/sfdx-jayree-plugin/commit/f2b384d87b48e5f325be5147bc1e8ad20f00ca59))
* **source:** added json output for source:fix, source:retrieve:full, source:retrieve:all commands ([efd8ca7](https://github.com/jayree/sfdx-jayree-plugin/commit/efd8ca7b0e0b9bf6f897879a518fe69da59e5db6))


### BREAKING CHANGES

* **source:** verbose flag has no effect anymore and will be deprecated in future releases

# [1.11.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.10.1...v1.11.0) (2020-06-19)


### Bug Fixes

* update dependencies ([460d4c1](https://github.com/jayree/sfdx-jayree-plugin/commit/460d4c116de9a51a68988c4fcb972dec2b7643e0))
* **scratchorgrevision:** support json format ([934f9c3](https://github.com/jayree/sfdx-jayree-plugin/commit/934f9c3e8a43de40fd260309c97320b8cf9024c2))
* **sourceretrievefull:** add new userPermissions ([18d6cca](https://github.com/jayree/sfdx-jayree-plugin/commit/18d6ccab481a669a39c5ddeaf285baeeede1ca09))
* update dependencies ([995786a](https://github.com/jayree/sfdx-jayree-plugin/commit/995786acf152b8e3af4e743e791995b466197c1c))


### Features

* **sourceretrievefull:** add scope for manifest(ignore) config ([e3a322c](https://github.com/jayree/sfdx-jayree-plugin/commit/e3a322c4962353d2318cea8d27d788151491c1a0))

## [1.10.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.10.0...v1.10.1) (2020-05-13)


### Bug Fixes

* update dependencies ([2529e8d](https://github.com/jayree/sfdx-jayree-plugin/commit/2529e8d534be47a217ab83b4c565833ce844ed55))
* **sourceretrieve*:** support MDP ([fc0ad31](https://github.com/jayree/sfdx-jayree-plugin/commit/fc0ad3117dea0f1ca134f343f73e5051e2ac5181))
* **sourceretrievefull:** add more metadata ([ce73e0f](https://github.com/jayree/sfdx-jayree-plugin/commit/ce73e0fa1a67c5509b935f51b8cc3d15e5a02ad3))

# [1.10.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.5...v1.10.0) (2020-05-05)


### Bug Fixes

* **sourceretrieve*:** fix json output (Windows) ([a805fdd](https://github.com/jayree/sfdx-jayree-plugin/commit/a805fddd3e7639e099e32eb68b8ce91ed819fcda))
* update dependencies ([fbe5188](https://github.com/jayree/sfdx-jayree-plugin/commit/fbe5188da452c48efd036c9547bb6d3dfef24699))
* **packagedescription:** revert "replace adm-zip with jszip" ([26e7baa](https://github.com/jayree/sfdx-jayree-plugin/commit/26e7baa73f6ffae38574eb95aa3a156573b2b1c9))
* **statecountry:** set country integration value to ISO alpha-2 code ([34ca6f7](https://github.com/jayree/sfdx-jayree-plugin/commit/34ca6f738c1ecea9fbf92a4868637b71ba92427a))


### Features

* **statecountry:** add new command jayree:automation:country:update ([9d0b0ca](https://github.com/jayree/sfdx-jayree-plugin/commit/9d0b0ca9460ee4c550c85043099ef2a2747cd59e))

## [1.9.5](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.4...v1.9.5) (2020-03-30)


### Bug Fixes

* **statecountry:** stability improvements ([d9791a3](https://github.com/jayree/sfdx-jayree-plugin/commit/d9791a3a1972fdc5e0210a97bbcbd67e665fbbe5))
* update dependencies ([931bfb9](https://github.com/jayree/sfdx-jayree-plugin/commit/931bfb9c3ce252b83053e8abc1c5f25a85c53027))
* **sourceretrieve*:** fix set-task path undefined ([3bef979](https://github.com/jayree/sfdx-jayree-plugin/commit/3bef97939250ed500a3b62b4334096842f66d40a))
* **statecountry:** exit workaround for long running jobs on windows ([aa57b1b](https://github.com/jayree/sfdx-jayree-plugin/commit/aa57b1bc65dbd8a80d69c872efde327ebf8986b7))

## [1.9.4](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.3...v1.9.4) (2020-03-05)


### Bug Fixes

* **statecountry:** waitFor table to be present in DOM and to be visible ([ac06a12](https://github.com/jayree/sfdx-jayree-plugin/commit/ac06a12c929ed62f5fdd7e31b3a93fad27768532))

## [1.9.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.2...v1.9.3) (2020-03-01)


### Bug Fixes

* **statecountry:** deactivate province IT-AO ([35787ba](https://github.com/jayree/sfdx-jayree-plugin/commit/35787ba5fbc3655af0d97eb75ee40dd44659ca54))

## [1.9.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.1...v1.9.2) (2020-02-29)


### Bug Fixes

* update dependencies ([4c8e225](https://github.com/jayree/sfdx-jayree-plugin/commit/4c8e2250d1cf831c9c130731fada5a3c77e9a149))
* **statecountry:** use real ISO Codes for CN and MX instead of mapping to the legacy SF Records ([53ca320](https://github.com/jayree/sfdx-jayree-plugin/commit/53ca32017ce6817c46f62c002989f7ca916b6384))

## [1.9.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.9.0...v1.9.1) (2020-02-17)


### Bug Fixes

* rename manifest:packagexml to manifest:generate ([7c595d3](https://github.com/jayree/sfdx-jayree-plugin/commit/7c595d3b9109c9ac4fceb359826544e8763c00b3))

# [1.9.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.8.2...v1.9.0) (2020-02-16)


### Bug Fixes

* update dependencies ([0b4922d](https://github.com/jayree/sfdx-jayree-plugin/commit/0b4922d5eed88e00000fce0ebfbba297c7a9d513))
* **packagexml:** fix apiVersion scope ([b0d43cc](https://github.com/jayree/sfdx-jayree-plugin/commit/b0d43cc439d43ef9d2c00fa7af6fdad2579e1e7e))
* **packagexml:** move packagexml command to manifest:packagexml ([ea2489a](https://github.com/jayree/sfdx-jayree-plugin/commit/ea2489af9a048127ef2c63483d88435b3248ff2c))
* **statecountry:** remove brackets from Subdivision name ([ae6f100](https://github.com/jayree/sfdx-jayree-plugin/commit/ae6f1000232c76c8e9d212ed00f840d766b7eceb))
* update dependencies ([c2fa047](https://github.com/jayree/sfdx-jayree-plugin/commit/c2fa04766967cdd7510204ba923cd118e78d23b0))


### Features

* add manifest:cleanup command ([5e5be79](https://github.com/jayree/sfdx-jayree-plugin/commit/5e5be795611232db16dd5d48336a5c9a912493e7))
* add org:streaming command ([4d36065](https://github.com/jayree/sfdx-jayree-plugin/commit/4d36065f4e44877d4b97a09753e213ca4df70cd4))
* **packagexml:** add includeflowversions flag ([63bf000](https://github.com/jayree/sfdx-jayree-plugin/commit/63bf0009a2be10527c9b707bb06fddc77f1a4100))
* **scratchorgrevision:** add Id and IsNameObsolete to output ([2b426bc](https://github.com/jayree/sfdx-jayree-plugin/commit/2b426bc5e525e3f981cfb082d9e235b8cb95543a))
* **scratchorgsettings:** compatibility with version 48.0 ([89a9ad5](https://github.com/jayree/sfdx-jayree-plugin/commit/89a9ad577bb8be94e5d9a07444cec5c5b97a7e7a))

## [1.8.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.8.1...v1.8.2) (2020-02-02)


### Bug Fixes

* update dependencies ([06bc1cf](https://github.com/jayree/sfdx-jayree-plugin/commit/06bc1cfeae261e85658d6852ff411698eed132ec))
* **sourcefix:** make set task more generic ([13921ee](https://github.com/jayree/sfdx-jayree-plugin/commit/13921ee2068537ab2e0dde1ec06d806f55fde368))
* **sourceretrieve*:** inject missing user- and objectPermissions ([5a19fb9](https://github.com/jayree/sfdx-jayree-plugin/commit/5a19fb91fa6dba73a001de49de3b88c33fa0c290))

## [1.8.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.8.0...v1.8.1) (2020-01-14)


### Bug Fixes

* update dependencies ([0068357](https://github.com/jayree/sfdx-jayree-plugin/commit/006835727599659e7610f11336f96f75be147a15))
* **sourceretrievefull:** add missing manifest file ([d3d4c96](https://github.com/jayree/sfdx-jayree-plugin/commit/d3d4c963f4851be95e5f26d5ee44bfdd48ab6bf1))

# [1.8.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.7.1...v1.8.0) (2020-01-10)


### Bug Fixes

* update dependencies ([34fcd58](https://github.com/jayree/sfdx-jayree-plugin/commit/34fcd585e1a17f1591705adeffc444d7fc1298f5))
* **scratchorgsettings:** some fixes for apiversion 48.0 ([8239e8c](https://github.com/jayree/sfdx-jayree-plugin/commit/8239e8c5a83720cd5944c8c7424a8195331f8434))
* **sourceretrieve*:** fix error handling ([210885e](https://github.com/jayree/sfdx-jayree-plugin/commit/210885e59d2e6d73c21e6b0e71819f80f5392624))
* add/update missing dependencies ([b4f3e7e](https://github.com/jayree/sfdx-jayree-plugin/commit/b4f3e7e08128c37ff5c23c9209c2c89d3362269f))
* **sourceretrieve*:** fix FORCE_COLOR issue ([992f107](https://github.com/jayree/sfdx-jayree-plugin/commit/992f1071e0b4ccfca6eedece37697fde96ea3c11))


### Features

* **sourcefix:** add new command jayree:source:fix ([5044929](https://github.com/jayree/sfdx-jayree-plugin/commit/5044929b174cababfdf46d1257661cf83492a45d))
* **statecountry:** add ProgressBar ([a1e1969](https://github.com/jayree/sfdx-jayree-plugin/commit/a1e1969b972fa53bdf33b369b8a7ab087b8b5f7b))


### Performance Improvements

* **sourceretrieveall:** optimizations ([4c6d76e](https://github.com/jayree/sfdx-jayree-plugin/commit/4c6d76ecf231b368c20eab47715b6bb30fc495a4))

## [1.7.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.7.0...v1.7.1) (2019-12-17)


### Bug Fixes

* **sourceretrieve*:** fix FORCE_COLOR issue ([960e3a7](https://github.com/jayree/sfdx-jayree-plugin/commit/960e3a75f1ffb2b01544a15e25dc58b668e18bcd))

# [1.7.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.6.1...v1.7.0) (2019-12-09)


### Bug Fixes

* **sourceretrievefull:** add verbose parameter ([c298e9e](https://github.com/jayree/sfdx-jayree-plugin/commit/c298e9e2ab197fd645cbb3554440808bbfba530b))


### Features

* **sourceretrieveall:** add new command jayree:source:retrieve:all ([4d84d85](https://github.com/jayree/sfdx-jayree-plugin/commit/4d84d8562fc93da4dd4463450b54597cb2044b4a))

## [1.6.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.6.0...v1.6.1) (2019-11-29)


### Bug Fixes

* **sourceretrievefull:** align parameter, options and output ([265e5d6](https://github.com/jayree/sfdx-jayree-plugin/commit/265e5d698676538d526693898f673ab27ea259b4))

# [1.6.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.5.2...v1.6.0) (2019-11-29)


### Bug Fixes

* **scratchorgrevision:** use RevisionCounter instead of RevisionNum ([e4e5681](https://github.com/jayree/sfdx-jayree-plugin/commit/e4e5681b0f3a254a9a313dfa8c003f5069a878e5))


### Features

* **sourceretrievefull:** add new command jayree:source:retrieve:full ([b1882b2](https://github.com/jayree/sfdx-jayree-plugin/commit/b1882b24d2bb32ca9cd27f20704c2924ff86fae6))

## [1.5.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.5.1...v1.5.2) (2019-11-17)


### Bug Fixes

* cleanup code ([5461876](https://github.com/jayree/sfdx-jayree-plugin/commit/54618764af1e1659d26994c8b27905ffa385b1bd))
* update dependencies ([bbe848d](https://github.com/jayree/sfdx-jayree-plugin/commit/bbe848d7b80cca66c7d114df7c3305b4b11dd3b4))
* **packagedescription:** replace adm-zip with jszip and update dependencies ([b6bedd6](https://github.com/jayree/sfdx-jayree-plugin/commit/b6bedd6ed5fa90b88665c9329ad4765f4a48990f))
* **scratchorgrevision:** add missing 'stored' value in json output ([e085d86](https://github.com/jayree/sfdx-jayree-plugin/commit/e085d86d1048b95a8bb8381e03a279199080ec8a))

## [1.5.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.5.0...v1.5.1) (2019-10-18)


### Bug Fixes

* **packagexml:** add RoleInTerritory2 StandardValueSet ([3ff6943](https://github.com/jayree/sfdx-jayree-plugin/commit/3ff6943faf5b7db16f200521599d867d50b3c734))
* **scratchorgsettings:** add Winter '20 settings ([49a0530](https://github.com/jayree/sfdx-jayree-plugin/commit/49a0530b3b364384917e3328de0a708035490042))
* update dependencies ([0469280](https://github.com/jayree/sfdx-jayree-plugin/commit/0469280801bb6f18ce96d2b075c05de27be01692))

# [1.5.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.4.3...v1.5.0) (2019-10-06)


### Bug Fixes

* update dependencies ([1363742](https://github.com/jayree/sfdx-jayree-plugin/commit/1363742))


### Features

* **hook:** add update hook to print changelog in terminal ([e8c9dfa](https://github.com/jayree/sfdx-jayree-plugin/commit/e8c9dfa))

## [1.4.3](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.4.2...v1.4.3) (2019-09-08)


### Bug Fixes

* **packagexml:** fix "UNKNOWN_EXCEPTION: An unexpected error occurred." ([f4ac845](https://github.com/jayree/sfdx-jayree-plugin/commit/f4ac845))
* update dependencies ([71686db](https://github.com/jayree/sfdx-jayree-plugin/commit/71686db))
* **scratchorgsettings:** exclude compileOnDeploy ([100e036](https://github.com/jayree/sfdx-jayree-plugin/commit/100e036))

## [1.4.2](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.4.1...v1.4.2) (2019-08-19)


### Bug Fixes

* **packagexml:** too much metadata was excluded with excludemanaged flag ([8a0f0e8](https://github.com/jayree/sfdx-jayree-plugin/commit/8a0f0e8))
* **scratchorgsettings:** new excludes ([f9d1d86](https://github.com/jayree/sfdx-jayree-plugin/commit/f9d1d86))
* update dependencies ([276beb9](https://github.com/jayree/sfdx-jayree-plugin/commit/276beb9))
* update dependencies ([c463d67](https://github.com/jayree/sfdx-jayree-plugin/commit/c463d67))

## [1.4.1](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.4.0...v1.4.1) (2019-05-13)


### Bug Fixes

* **statecountry:** fix for italy ([554e5ec](https://github.com/jayree/sfdx-jayree-plugin/commit/554e5ec))

# [1.4.0](https://github.com/jayree/sfdx-jayree-plugin/compare/v1.3.0...v1.4.0) (2019-05-12)


### Bug Fixes

* update dependencies ([d256015](https://github.com/jayree/sfdx-jayree-plugin/commit/d256015))
* update dependencies ([f8b8bb6](https://github.com/jayree/sfdx-jayree-plugin/commit/f8b8bb6))


### Features

* **statecountry:** identify if stateIsoCode needs to be updated/created ([eb05002](https://github.com/jayree/sfdx-jayree-plugin/commit/eb05002))
* **statecountry:** rename cmd. create to import (alias: create,update) ([5fc03ab](https://github.com/jayree/sfdx-jayree-plugin/commit/5fc03ab))

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
