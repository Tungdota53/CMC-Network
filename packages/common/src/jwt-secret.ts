/**
 * Resolve the shared JWT secret with a hard fail-fast in production.
 *
 * The dev fallback used to be `'SECRET_KEY_FOR_DEV_ONLY'`, which silently
 * worked in production too — anyone could mint valid tokens against a
 * deployment that forgot to set JWT_SECRET. We now refuse to boot if
 * NODE_ENV is `production` and JWT_SECRET is missing or still the old
 * placeholder.
 *
 * Lives in its own module (not common.module.ts) so the auth guards can import
 * it without creating a circular dependency with CommonModule.
 */
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  const isPlaceholder = !secret || secret === 'SECRET_KEY_FOR_DEV_ONLY';

  if (isProd && isPlaceholder) {
    throw new Error(
      'JWT_SECRET must be set to a strong random value in production. ' +
        'Refusing to start with the dev placeholder.',
    );
  }
  return secret || 'SECRET_KEY_FOR_DEV_ONLY';
}
