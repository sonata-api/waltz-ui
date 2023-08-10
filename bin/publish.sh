#!/bin/bash

find dist -maxdepth 1 | \
  xargs -I{} sh -c "cd {} && npm publish --access=public"
