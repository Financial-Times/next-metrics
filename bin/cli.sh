#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
make --makefile "${DIR}/../Makefile" --directory "${DIR}/../" run
