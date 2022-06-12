## :tada: 2.3.1-beta.3 (2022-04-04)


### :sparkles: Features

* add i18n for en ([1936ccf](https://github.com/Molunerfinn/PicGo/commit/1936ccf))
* add tencent-cos options for url ([af291e4](https://github.com/Molunerfinn/PicGo/commit/af291e4)), closes [#862](https://github.com/Molunerfinn/PicGo/issues/862) [#863](https://github.com/Molunerfinn/PicGo/issues/863) [#865](https://github.com/Molunerfinn/PicGo/issues/865) [#524](https://github.com/Molunerfinn/PicGo/issues/524) [#845](https://github.com/Molunerfinn/PicGo/issues/845) [#732](https://github.com/Molunerfinn/PicGo/issues/732)
* add upload-clipboard-image from electron' clipboard ([27628da](https://github.com/Molunerfinn/PicGo/commit/27628da)), closes [#822](https://github.com/Molunerfinn/PicGo/issues/822)
* add wayland support for linux ([f1c8507](https://github.com/Molunerfinn/PicGo/commit/f1c8507))
* click cancel in rename-window will use origin filename now ([04701d4](https://github.com/Molunerfinn/PicGo/commit/04701d4)), closes [#791](https://github.com/Molunerfinn/PicGo/issues/791)


### :bug: Bug Fixes

* fix mini-page can't upload image from dragging browser image ([6bcd019](https://github.com/Molunerfinn/PicGo/commit/6bcd019)), closes [#822](https://github.com/Molunerfinn/PicGo/issues/822)
* mini window not always on top after reopen ([c79a286](https://github.com/Molunerfinn/PicGo/commit/c79a286))
* notification freeze the main-process after uploading with clipboard ([3a50315](https://github.com/Molunerfinn/PicGo/commit/3a50315)), closes [#824](https://github.com/Molunerfinn/PicGo/issues/824)
* picgo.log path error ([6b6ae27](https://github.com/Molunerfinn/PicGo/commit/6b6ae27)), closes [#819](https://github.com/Molunerfinn/PicGo/issues/819)


### :pencil: Documentation

* update readme ([6bcda9b](https://github.com/Molunerfinn/PicGo/commit/6bcda9b)), closes [#849](https://github.com/Molunerfinn/PicGo/issues/849) [#850](https://github.com/Molunerfinn/PicGo/issues/850)


### :package: Chore

* types change ([43d2a8e](https://github.com/Molunerfinn/PicGo/commit/43d2a8e))
* update fix-path ([bcaf255](https://github.com/Molunerfinn/PicGo/commit/bcaf255)), closes [#774](https://github.com/Molunerfinn/PicGo/issues/774)



## :tada: 2.3.1-beta.2 (2022-01-06)


### :bug: Bug Fixes

* electron builder actions bug ([5dd6e72](https://github.com/Molunerfinn/PicGo/commit/5dd6e72))
* linux github actions workflow bug ([5cb8151](https://github.com/Molunerfinn/PicGo/commit/5cb8151))



## :tada: 2.3.1-beta.1 (2022-01-05)


### :package: Chore

* update ci build scripts ([56e814a](https://github.com/Molunerfinn/PicGo/commit/56e814a))



## :tada: 2.3.1-beta.0 (2022-01-05)


### :bug: Bug Fixes

* mini window drag bug ([34b3656](https://github.com/Molunerfinn/PicGo/commit/34b3656))


### :package: Chore

* add mac-arm64 build support ([f2a4197](https://github.com/Molunerfinn/PicGo/commit/f2a4197))
* update electron from v6 -> v16 ([ea20d3b](https://github.com/Molunerfinn/PicGo/commit/ea20d3b))



# :tada: 2.3.0 (2021-09-11)


### :sparkles: Features

* add open devtool option ([75e3edc](https://github.com/Molunerfinn/PicGo/commit/75e3edc))


### :bug: Bug Fixes

* shift key function in gallery page ([5895889](https://github.com/Molunerfinn/PicGo/commit/5895889))
* some bugs ([a676c08](https://github.com/Molunerfinn/PicGo/commit/a676c08)), closes [#722](https://github.com/Molunerfinn/PicGo/issues/722)
* urlEncode bug when copy ([6c6f847](https://github.com/Molunerfinn/PicGo/commit/6c6f847)), closes [#731](https://github.com/Molunerfinn/PicGo/issues/731)


### :pencil: Documentation

* update FAQ ([58420c8](https://github.com/Molunerfinn/PicGo/commit/58420c8))



# :tada: 2.3.0-beta.8 (2021-08-13)


### :bug: Bug Fixes

* settings bug ([20d3cf9](https://github.com/Molunerfinn/PicGo/commit/20d3cf9)), closes [#710](https://github.com/Molunerfinn/PicGo/issues/710)
* upload clipboard images via http should return list ([ae69263](https://github.com/Molunerfinn/PicGo/commit/ae69263)), closes [#721](https://github.com/Molunerfinn/PicGo/issues/721)



# :tada: 2.3.0-beta.7 (2021-08-01)


### :sparkles: Features

* add gallery db ([6ddd660](https://github.com/Molunerfinn/PicGo/commit/6ddd660))
* add win32 support ([1657542](https://github.com/Molunerfinn/PicGo/commit/1657542)), closes [#632](https://github.com/Molunerfinn/PicGo/issues/632)
* finish custom config path ([7030f7a](https://github.com/Molunerfinn/PicGo/commit/7030f7a)), closes [#255](https://github.com/Molunerfinn/PicGo/issues/255)


### :bug: Bug Fixes

* bug of gallery db for plugin ([96a63ea](https://github.com/Molunerfinn/PicGo/commit/96a63ea))
* enable plugin should reload ([49e5f34](https://github.com/Molunerfinn/PicGo/commit/49e5f34)), closes [#659](https://github.com/Molunerfinn/PicGo/issues/659)
* gallery db bug ([f1eb7f4](https://github.com/Molunerfinn/PicGo/commit/f1eb7f4))
* multiple uploading in the same time will cause output conflict ([06b67e5](https://github.com/Molunerfinn/PicGo/commit/06b67e5)), closes [#666](https://github.com/Molunerfinn/PicGo/issues/666)
* multiple uploading in the same time will cause rename failed ([12cecc2](https://github.com/Molunerfinn/PicGo/commit/12cecc2))
* uploader error in linux ([ab762ef](https://github.com/Molunerfinn/PicGo/commit/ab762ef)), closes [#627](https://github.com/Molunerfinn/PicGo/issues/627)
* use uploader first ([92022a6](https://github.com/Molunerfinn/PicGo/commit/92022a6))
* windows ia32 && x64 build options ([bdf523a](https://github.com/Molunerfinn/PicGo/commit/bdf523a))



# :tada: 2.3.0-beta.6 (2021-04-24)


### :sparkles: Features

* add baidu tongji for analytics ([f536391](https://github.com/Molunerfinn/PicGo/commit/f536391))
* add logs for picgo-server ([2d9e9c0](https://github.com/Molunerfinn/PicGo/commit/2d9e9c0)), closes [#627](https://github.com/Molunerfinn/PicGo/issues/627)
* add privacy policy ([992ff35](https://github.com/Molunerfinn/PicGo/commit/992ff35))


### :bug: Bug Fixes

* add plugin install failed notice ([b05139f](https://github.com/Molunerfinn/PicGo/commit/b05139f))
* default picBed using picBed.uploader instead of picBed.current ([0a986c8](https://github.com/Molunerfinn/PicGo/commit/0a986c8))
* dev error with install vue-devtools ([a657c51](https://github.com/Molunerfinn/PicGo/commit/a657c51)), closes [#653](https://github.com/Molunerfinn/PicGo/issues/653) [#658](https://github.com/Molunerfinn/PicGo/issues/658)
* disable plugin need reload app ([a1b70b4](https://github.com/Molunerfinn/PicGo/commit/a1b70b4))
* fix analytics value ([06d40ef](https://github.com/Molunerfinn/PicGo/commit/06d40ef))
* windows cli uploading bug ([321e339](https://github.com/Molunerfinn/PicGo/commit/321e339)), closes [#657](https://github.com/Molunerfinn/PicGo/issues/657)


### :package: Chore

* add main process hot reload ([3fd6e4e](https://github.com/Molunerfinn/PicGo/commit/3fd6e4e))
* fix eslint error notice in indent ([69e1dc8](https://github.com/Molunerfinn/PicGo/commit/69e1dc8))



# :tada: 2.3.0-beta.5 (2021-04-04)


### :sparkles: Features

* add local plugin support && npm registry/proxy support ([f0e1fa1](https://github.com/Molunerfinn/PicGo/commit/f0e1fa1))
* 为Linux系统适配桌面图标栏（Tray） ([#603](https://github.com/Molunerfinn/PicGo/issues/603)) ([0fe3ade](https://github.com/Molunerfinn/PicGo/commit/0fe3ade))


### :bug: Bug Fixes

* default github placeholder ([51d80a6](https://github.com/Molunerfinn/PicGo/commit/51d80a6))


### :package: Chore

* change travis-ci -> GitHub Actions ([064f37d](https://github.com/Molunerfinn/PicGo/commit/064f37d))



# :tada: 2.3.0-beta.4 (2020-12-19)


### :sparkles: Features

* add global value for PicGo get GUI_VERSION & CORE_VERSION ([eab014d](https://github.com/Molunerfinn/PicGo/commit/eab014d))
* **config:** auto configuration backup & fallback to avoid main process crash ([32b8b97](https://github.com/Molunerfinn/PicGo/commit/32b8b97)), closes [#568](https://github.com/Molunerfinn/PicGo/issues/568)


### :bug: Bug Fixes

* disabled plugin won't be shown in plugin page ([33fdb16](https://github.com/Molunerfinn/PicGo/commit/33fdb16))
* shortKeyConfig maybe undefined ([7b5e5ef](https://github.com/Molunerfinn/PicGo/commit/7b5e5ef)), closes [#557](https://github.com/Molunerfinn/PicGo/issues/557)
* url encode before uploading by url ([ce2b5cd](https://github.com/Molunerfinn/PicGo/commit/ce2b5cd)), closes [#581](https://github.com/Molunerfinn/PicGo/issues/581)


### :pencil: Documentation

* add flutter-picgo ([92ff282](https://github.com/Molunerfinn/PicGo/commit/92ff282))
* add gitads ([2d42381](https://github.com/Molunerfinn/PicGo/commit/2d42381))
* rm gitads ([bb90e17](https://github.com/Molunerfinn/PicGo/commit/bb90e17))
* update discussions in doc ([e793599](https://github.com/Molunerfinn/PicGo/commit/e793599))
* update install command by Homebrew ([#599](https://github.com/Molunerfinn/PicGo/issues/599)) ([bd2311b](https://github.com/Molunerfinn/PicGo/commit/bd2311b))
* update README.md ([#555](https://github.com/Molunerfinn/PicGo/issues/555)) ([2151857](https://github.com/Molunerfinn/PicGo/commit/2151857))



# :tada: 2.3.0-beta.3 (2020-07-12)


### :bug: Bug Fixes

* choose default picBed failure ([21d3942](https://github.com/Molunerfinn/PicGo/commit/21d3942)), closes [#537](https://github.com/Molunerfinn/PicGo/issues/537)
* shortkey disabled failure ([4f0809e](https://github.com/Molunerfinn/PicGo/commit/4f0809e)), closes [#534](https://github.com/Molunerfinn/PicGo/issues/534)



# :tada: 2.3.0-beta.2 (2020-07-12)


### :sparkles: Features

* add qrcode for picbeds' config ([7fabc47](https://github.com/Molunerfinn/PicGo/commit/7fabc47))


### :bug: Bug Fixes

* encoding the result of picgo-server ([db71139](https://github.com/Molunerfinn/PicGo/commit/db71139))
* initialize db bugs ([5f87018](https://github.com/Molunerfinn/PicGo/commit/5f87018))


### :pencil: Documentation

* update readme ([1c5880a](https://github.com/Molunerfinn/PicGo/commit/1c5880a))



# :tada: 2.3.0-beta.1 (2020-06-28)


### :bug: Bug Fixes

* auto-copy option && copy style ([b6e3adb](https://github.com/Molunerfinn/PicGo/commit/b6e3adb))
* beta version update bug ([18ad542](https://github.com/Molunerfinn/PicGo/commit/18ad542))
* paste url encoding bug ([59d3eba](https://github.com/Molunerfinn/PicGo/commit/59d3eba)), closes [#454](https://github.com/Molunerfinn/PicGo/issues/454)


### :pencil: Documentation

* update FAQ && ISSUE_TEMPLATE ([2c57a27](https://github.com/Molunerfinn/PicGo/commit/2c57a27))
* update readme ([2adff1e](https://github.com/Molunerfinn/PicGo/commit/2adff1e))



# :tada: 2.3.0-beta.0 (2020-04-30)


### :sparkles: Features

* add autoCopy option for users to use or not ([67e526f](https://github.com/Molunerfinn/PicGo/commit/67e526f))
* add beta-version update support ([ad6acd8](https://github.com/Molunerfinn/PicGo/commit/ad6acd8))
* add smms-v2 support ([3f3ea69](https://github.com/Molunerfinn/PicGo/commit/3f3ea69))
* add uploading image from URL support ([a28c678](https://github.com/Molunerfinn/PicGo/commit/a28c678))
* finish all-select && shift multi-select ([2aeca50](https://github.com/Molunerfinn/PicGo/commit/2aeca50)), closes [#342](https://github.com/Molunerfinn/PicGo/issues/342)


### :bug: Bug Fixes

* confused port number auto increasing when opening a new PicGo app ([cd70a1a](https://github.com/Molunerfinn/PicGo/commit/cd70a1a))
* correct inputbox value && remove listener ([32334e9](https://github.com/Molunerfinn/PicGo/commit/32334e9))
* give a hint when node.js is not installed ([7e86618](https://github.com/Molunerfinn/PicGo/commit/7e86618))
* right-click menu upload fails with PicGo open ([96cdfea](https://github.com/Molunerfinn/PicGo/commit/96cdfea)), closes [#415](https://github.com/Molunerfinn/PicGo/issues/415)
* some win10 upload clipboard image crash ([cc182b0](https://github.com/Molunerfinn/PicGo/commit/cc182b0))
* travis-ci bug ([b357dfb](https://github.com/Molunerfinn/PicGo/commit/b357dfb))
* url uploader bug ([96544f5](https://github.com/Molunerfinn/PicGo/commit/96544f5))


### :pencil: Documentation

* update choco install picgo ([f357557](https://github.com/Molunerfinn/PicGo/commit/f357557))
* update docs ([fd7673e](https://github.com/Molunerfinn/PicGo/commit/fd7673e))
* update readme ([fb014dd](https://github.com/Molunerfinn/PicGo/commit/fb014dd))


### :package: Chore

* update funding url ([024d9cf](https://github.com/Molunerfinn/PicGo/commit/024d9cf))



## :tada: 2.2.2 (2020-01-20)


### :bug: Bug Fixes

* picgo-server upload clipboard file's result bug ([4ebd76f](https://github.com/Molunerfinn/PicGo/commit/4ebd76f))
* releaseUrl may can't get latest version ([ee46ab1](https://github.com/Molunerfinn/PicGo/commit/ee46ab1))



## :tada: 2.2.1 (2020-01-09)


### :sparkles: Features

* add alias for plugin config name ([5a06483](https://github.com/Molunerfinn/PicGo/commit/5a06483))
* add aliyun oss options ([a33f1ad](https://github.com/Molunerfinn/PicGo/commit/a33f1ad)), closes [#347](https://github.com/Molunerfinn/PicGo/issues/347)
* **server:** add http server for uploading images by a http request ([c56d4ef](https://github.com/Molunerfinn/PicGo/commit/c56d4ef))
* add server config settings ([6b57cf7](https://github.com/Molunerfinn/PicGo/commit/6b57cf7))
* only shows visible pic-beds ([9d4d605](https://github.com/Molunerfinn/PicGo/commit/9d4d605)), closes [#310](https://github.com/Molunerfinn/PicGo/issues/310)


### :bug: Bug Fixes

* decrease title-bar z-index when config-form dialog shows ([f2750e1](https://github.com/Molunerfinn/PicGo/commit/f2750e1))
* **website:** website pictures error ([a5b6526](https://github.com/Molunerfinn/PicGo/commit/a5b6526))
* add new tray icon for macOS dark-mode ([c5adf3b](https://github.com/Molunerfinn/PicGo/commit/c5adf3b)), closes [#267](https://github.com/Molunerfinn/PicGo/issues/267)
* beforeOpen handler in windows ([cd30a6c](https://github.com/Molunerfinn/PicGo/commit/cd30a6c))
* busApi event register first && emit later ([e1a0cbb](https://github.com/Molunerfinn/PicGo/commit/e1a0cbb))
* enum type error ([4e3fa28](https://github.com/Molunerfinn/PicGo/commit/4e3fa28))
* handle empty request-body ([81e6acb](https://github.com/Molunerfinn/PicGo/commit/81e6acb))
* launch error in new structrue ([bc8e641](https://github.com/Molunerfinn/PicGo/commit/bc8e641))
* miniWindow minimize bug ([5f2b7c7](https://github.com/Molunerfinn/PicGo/commit/5f2b7c7))
* plugin config-form && default plugin logo ([514fc40](https://github.com/Molunerfinn/PicGo/commit/514fc40))
* release script ([b4f10c6](https://github.com/Molunerfinn/PicGo/commit/b4f10c6))
* removeById handler error ([c4f0a30](https://github.com/Molunerfinn/PicGo/commit/c4f0a30)), closes [#382](https://github.com/Molunerfinn/PicGo/issues/382)
* rename page not work ([29a55ed](https://github.com/Molunerfinn/PicGo/commit/29a55ed))
* save debug mode && PICGO_ENV into config file ([c6ead5b](https://github.com/Molunerfinn/PicGo/commit/c6ead5b))
* server may never start ([73870a5](https://github.com/Molunerfinn/PicGo/commit/73870a5))
* settingPage && miniPage style in windows ([3fd9572](https://github.com/Molunerfinn/PicGo/commit/3fd9572))


### :pencil: Documentation

* add note for windows electron mirror ([46a49ed](https://github.com/Molunerfinn/PicGo/commit/46a49ed))
* remove weibo picbed ([e81b8f4](https://github.com/Molunerfinn/PicGo/commit/e81b8f4))
* update installation by scoop ([91b397d](https://github.com/Molunerfinn/PicGo/commit/91b397d)), closes [#295](https://github.com/Molunerfinn/PicGo/issues/295)
* update readme ([1b3522e](https://github.com/Molunerfinn/PicGo/commit/1b3522e))
* update README ([f491209](https://github.com/Molunerfinn/PicGo/commit/f491209))
* update site ([fe9e19a](https://github.com/Molunerfinn/PicGo/commit/fe9e19a))



# :tada: 2.2.0 (2020-01-01)


### :sparkles: Features

* add alias for plugin config name ([5a06483](https://github.com/Molunerfinn/PicGo/commit/5a06483))
* add aliyun oss options ([a33f1ad](https://github.com/Molunerfinn/PicGo/commit/a33f1ad)), closes [#347](https://github.com/Molunerfinn/PicGo/issues/347)
* **server:** add http server for uploading images by a http request ([c56d4ef](https://github.com/Molunerfinn/PicGo/commit/c56d4ef))
* add server config settings ([6b57cf7](https://github.com/Molunerfinn/PicGo/commit/6b57cf7))
* only shows visible pic-beds ([9d4d605](https://github.com/Molunerfinn/PicGo/commit/9d4d605)), closes [#310](https://github.com/Molunerfinn/PicGo/issues/310)


### :bug: Bug Fixes

* beforeOpen handler in windows ([cd30a6c](https://github.com/Molunerfinn/PicGo/commit/cd30a6c))
* **website:** website pictures error ([a5b6526](https://github.com/Molunerfinn/PicGo/commit/a5b6526))
* add new tray icon for macOS dark-mode ([c5adf3b](https://github.com/Molunerfinn/PicGo/commit/c5adf3b)), closes [#267](https://github.com/Molunerfinn/PicGo/issues/267)
* busApi event register first && emit later ([e1a0cbb](https://github.com/Molunerfinn/PicGo/commit/e1a0cbb))
* decrease title-bar z-index when config-form dialog shows ([f2750e1](https://github.com/Molunerfinn/PicGo/commit/f2750e1))
* enum type error ([4e3fa28](https://github.com/Molunerfinn/PicGo/commit/4e3fa28))
* handle empty request-body ([81e6acb](https://github.com/Molunerfinn/PicGo/commit/81e6acb))
* launch error in new structrue ([bc8e641](https://github.com/Molunerfinn/PicGo/commit/bc8e641))
* plugin config-form && default plugin logo ([514fc40](https://github.com/Molunerfinn/PicGo/commit/514fc40))
* release script ([b4f10c6](https://github.com/Molunerfinn/PicGo/commit/b4f10c6))
* rename page not work ([29a55ed](https://github.com/Molunerfinn/PicGo/commit/29a55ed))
* save debug mode && PICGO_ENV into config file ([c6ead5b](https://github.com/Molunerfinn/PicGo/commit/c6ead5b))
* settingPage && miniPage style in windows ([3fd9572](https://github.com/Molunerfinn/PicGo/commit/3fd9572))


### :pencil: Documentation

* add note for windows electron mirror ([46a49ed](https://github.com/Molunerfinn/PicGo/commit/46a49ed))
* remove weibo picbed ([e81b8f4](https://github.com/Molunerfinn/PicGo/commit/e81b8f4))
* update installation by scoop ([91b397d](https://github.com/Molunerfinn/PicGo/commit/91b397d)), closes [#295](https://github.com/Molunerfinn/PicGo/issues/295)
* update readme ([1b3522e](https://github.com/Molunerfinn/PicGo/commit/1b3522e))
* update README ([f491209](https://github.com/Molunerfinn/PicGo/commit/f491209))
* update site ([fe9e19a](https://github.com/Molunerfinn/PicGo/commit/fe9e19a))



## :tada: 2.1.2 (2019-04-19)


### :sparkles: Features

* add file-name for customurl ([c59e2bc](https://github.com/Molunerfinn/PicGo/commit/c59e2bc)), closes [#173](https://github.com/Molunerfinn/PicGo/issues/173)


### :bug: Bug Fixes

* log-level filter bug ([4e02244](https://github.com/Molunerfinn/PicGo/commit/4e02244)), closes [#237](https://github.com/Molunerfinn/PicGo/issues/237)
* log-level's reset value from 'all' -> ['all'] ([3c6b329](https://github.com/Molunerfinn/PicGo/commit/3c6b329)), closes [#240](https://github.com/Molunerfinn/PicGo/issues/240) [#237](https://github.com/Molunerfinn/PicGo/issues/237)
* mini window hidden bug in linux ([466dbec](https://github.com/Molunerfinn/PicGo/commit/466dbec)), closes [#239](https://github.com/Molunerfinn/PicGo/issues/239)



## :tada: 2.1.1 (2019-04-16)


### :bug: Bug Fixes

* upload-area can't upload images ([4000cea](https://github.com/Molunerfinn/PicGo/commit/4000cea))



# :tada: 2.1.0 (2019-04-15)


### :sparkles: Features

* add commandline argvs support for picgo app ([6db86ec](https://github.com/Molunerfinn/PicGo/commit/6db86ec))
* add gui-api for remove event ([407b821](https://github.com/Molunerfinn/PicGo/commit/407b821)), closes [#201](https://github.com/Molunerfinn/PicGo/issues/201)
* add windows context menu ([e5fbe75](https://github.com/Molunerfinn/PicGo/commit/e5fbe75))
* add workflow for mac ([7f17697](https://github.com/Molunerfinn/PicGo/commit/7f17697))
* support commandline -> upload images in clipboard ([74c7016](https://github.com/Molunerfinn/PicGo/commit/74c7016))


### :bug: Bug Fixes

* qiniu area option from select group -> input ([c64959a](https://github.com/Molunerfinn/PicGo/commit/c64959a)), closes [#230](https://github.com/Molunerfinn/PicGo/issues/230)


### :pencil: Documentation

* add brew cask source ([6122e17](https://github.com/Molunerfinn/PicGo/commit/6122e17))


### :package: Chore

* add picgo bump-version ([37f1d34](https://github.com/Molunerfinn/PicGo/commit/37f1d34))



