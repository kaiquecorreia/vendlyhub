import { join } from 'path';

/**
 * Nest compiles `src/**` to `dist/src/**`, so `__dirname` is often `.../dist/src` at runtime.
 * A single `..` would resolve to `dist/uploads` instead of the project `uploads/` folder.
 */
const parts = __dirname.split(/[/\\]/);
const isDistSrc =
  parts.length >= 2 &&
  parts[parts.length - 1] === 'src' &&
  parts[parts.length - 2] === 'dist';
const upLevels = isDistSrc ? 2 : 1;
const up = Array<string>(upLevels).fill('..');

/** Same tree as `express.static` in main.ts — project root `uploads/`, not `dist/uploads`. */
export const UPLOADS_ROOT = join(__dirname, ...up, 'uploads');
export const PRODUCTS_UPLOAD_DIR = join(UPLOADS_ROOT, 'products');
export const LOGOS_UPLOAD_DIR = join(UPLOADS_ROOT, 'logos');
export const AVATARS_UPLOAD_DIR = join(UPLOADS_ROOT, 'avatars');
