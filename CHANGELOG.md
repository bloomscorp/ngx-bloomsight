# Changelog

# [2.1.0](https://github.com/bloomscorp/ngx-bloomsight/compare/v2.0.0...v2.1.0) (2026-10-25)

### Features

* provideBloomsightMail() and emailTarget move mail to blooms.ai ([9241393](https://github.com/bloomscorp/ngx-bloomsight/commit/9241393a64f3eb2d444d2acfeae4b9f685feda12))

# [2.0.0](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.6.0...v2.0.0) (2026-10-15)

* feat!: provideBloomsight() and one BloomsightService replace the 1.x module ([ed6091c](https://github.com/bloomscorp/ngx-bloomsight/commit/ed6091ce0ff9247e1c93d6242fe582bf4aeed484))

### Bug Fixes

* an init failure no longer breaks the host app (review RV4) ([1c67e8a](https://github.com/bloomscorp/ngx-bloomsight/commit/1c67e8a4acd632741b8dc634ed0739611d529734))
* export BloomsightError so apps never import the core ([ac6d4b4](https://github.com/bloomscorp/ngx-bloomsight/commit/ac6d4b4e227e13f95ca6cc9560fc9c89c114cafc))
* remove all deep imports into bloomsight.js (P1) ([e9da741](https://github.com/bloomscorp/ngx-bloomsight/commit/e9da741c057a9a0a2653b85b2fa4a0ba93d4af4d))
* single SDK init, correct peers, redirect-aware page views, version sync ([60ecc44](https://github.com/bloomscorp/ngx-bloomsight/commit/60ecc44fe20ba9b974c31574f5dbe679829d5e17))
* the published component broke Angular 19-21 builds (review RV1, RV2) ([e410276](https://github.com/bloomscorp/ngx-bloomsight/commit/e41027683b8d018a27abe2c7d5f2e8c5b2e8b64e))
* type the mail engine as the core's own type, without a cast (review RV3) ([f0cd058](https://github.com/bloomscorp/ngx-bloomsight/commit/f0cd058859e348a43761d653995cffd866d94fa0))

### Features

* rebuild the demo app on the 2.0.0 API, safe by default ([d8434ec](https://github.com/bloomscorp/ngx-bloomsight/commit/d8434ec774bcc0d1c4e226eca210cdc55e1a5ba9))

### BREAKING CHANGES

* forRoot() and both 1.x services are gone. Configure with
  provideBloomsight(config) and inject BloomsightService. The label argument
  is removed from track() and trackData(), and sendMail takes one object and
  returns an Observable instead of taking callbacks.

# [1.6.0](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.22...v1.5.1) (2026-07-30)


### Features

* migrate to footprint-api and require bloomsight.js >=0.7.0 ([324bb1b](https://github.com/bloomscorp/ngx-bloomsight/commit/324bb1b684c648aafd53cb7004e2b791397eb9e9))



## [1.5.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.22...v1.5.1) (2025-02-17)

## [1.5.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.22...v1.5.1) (2025-02-17)

## [1.5.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.22...v1.5.1) (2025-02-17)

## [1.4.22](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.21...v1.4.22) (2024-08-06)

## [1.4.21](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.20...v1.4.21) (2024-05-20)

## [1.4.20](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.19...v1.4.20) (2024-05-20)

## [1.4.19](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.18...v1.4.19) (2024-05-17)

## [1.4.18](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.16...v1.4.18) (2024-05-17)

## [1.4.16](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.15...v1.4.16) (2024-05-14)

## [1.4.15](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.13...v1.4.15) (2024-05-14)

## [1.4.13](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.11...v1.4.13) (2024-05-14)

## [1.4.11](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.9...v1.4.11) (2024-05-03)

## [1.4.9](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.8...v1.4.9) (2024-05-01)

## [1.4.8](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.7...v1.4.8) (2024-04-19)

## [1.4.7](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.6...v1.4.7) (2024-04-19)

## [1.4.6](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.5...v1.4.6) (2024-04-18)

## [1.4.5](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.4...v1.4.5) (2024-04-18)

## [1.4.4](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.3...v1.4.4) (2024-04-13)

## [1.4.3](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.2...v1.4.3) (2024-04-13)

## [1.4.2](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.1...v1.4.2) (2024-04-10)

## [1.4.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.0...v1.4.1) (2024-04-09)

## [1.4.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v1.4.0...v1.4.1) (2024-04-09)

# [1.4.0](https://github.com/bloomscorp/ngx-bloomsight/compare/v0.2.0...v1.4.0) (2024-04-04)


### Features

* integrate @bloomscorp/bloomsight.js ([a5aff2d](https://github.com/bloomscorp/ngx-bloomsight/commit/a5aff2d181204571d9ac46579660d5c8926c8923))

# [0.2.0](https://github.com/bloomscorp/ngx-bloomsight/compare/v0.1.1...v0.2.0) (2024-04-04)


### Features

* add page view tracking ([a2b8eb2](https://github.com/bloomscorp/ngx-bloomsight/commit/a2b8eb21fbba701f701fd9a8d4860c5213562a67))

## [0.1.1](https://github.com/bloomscorp/ngx-bloomsight/compare/v0.1.0...v0.1.1) (2024-04-04)

# 0.1.0 (2024-04-04)


### Features

* initialize library ([349ae21](https://github.com/bloomscorp/ngx-bloomsight/commit/349ae2193474f521d58c0d0c41d99b864cea7327))
