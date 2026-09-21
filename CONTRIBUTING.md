# Contributing

Vehicle-Vitals is closed-source. The source is publicly visible, but this isn't an open-source project — there's no public issue tracker and outside pull requests aren't accepted.

If you have collaborator access to this repository:

1. Branch from `develop` (`feature/<short-description>` or `fix/<short-description>`) — `develop` is the active integration branch; `staging` and `main` are only updated via promotion PRs.
2. Keep commits focused, and write commit messages that explain *why*, not just *what*.
3. Run `flutter analyze` and `flutter test` in `packages/mobile` before opening a pull request.
4. Open the PR against `develop` and request review — don't merge your own changes without one.
5. The Cloud Functions backend lives in a separate private repo, [vehicle-vitals-functions](../vehicle-vitals-functions) — server-side changes belong there, not in this repo.

Questions about contributing should go to the repository owner (see SUPPORT.md).
