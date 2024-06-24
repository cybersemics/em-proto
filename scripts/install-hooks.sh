#!/bin/bash

# Use a simple bash script to install git hooks.
# husky was slow and did not play nice with nvm.
# lefthook suppressed the post-commit notification for some reason.

# change the git hook directory from .git/hooks to .hooks
git config core.hooksPath .hooks