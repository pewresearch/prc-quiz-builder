# prc/block-utils

Shared PHP utilities for PRC block rendering: `classNames`, `find_block` / `find_blocks`, gap/spacing helpers, `get_block_attributes`, and sliding-window `Pagination` markup.

## Install

```bash
composer require prc/block-utils
```

Develop this library in its own repository (e.g. [`pewresearch/prc-block-utils`](https://github.com/pewresearch/prc-block-utils)). In the PRC Platform monorepo, `prc-platform-core` currently wires `prc/block-utils` with a **path** repository pointing at a sibling checkout (`../prc-block-utils` next to `prc-platform`). After you publish this package on GitHub, switch that Composer entry to a **`vcs`** repository with the same URL (mirroring `prc/wp-html-processors`).

## Namespace

All functions live in `PRC\BlockUtils`:

```php
use function PRC\BlockUtils\classNames;
use PRC\BlockUtils\Pagination;

$class = classNames( 'foo', [ 'is-active' => $active ] );

$pagination = new Pagination( $items );
echo $pagination->get_markup();
```

## Development & tests

```bash
composer install
npm install
npm run env:start
npm run env:install-tests   # one-time
npm test
```

Refresh the vendored design-system palette fixture from a sibling checkout:

```bash
bash bin/sync-design-system.sh
```

## License

GPL-2.0-or-later
