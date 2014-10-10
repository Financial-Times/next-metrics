#!/bin/sh
NODE_PATH=$( dirname "$( npm bin --g )" )
NEXT_ROUTER="${NODE_PATH}/lib/node_modules/next-router/"
make --makefile "${NEXT_ROUTER}Makefile" --directory "${NEXT_ROUTER}" run
