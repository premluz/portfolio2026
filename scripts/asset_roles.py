"""Python twin of dist/asset-roles.js; tests/asset-roles.mjs checks the two agree on every catalog asset."""

BACKDROP_ROLE = "backdrop"


def is_backdrop(asset):
    return asset.get("role") == BACKDROP_ROLE or asset["id"].endswith("-bg")
