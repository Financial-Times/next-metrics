node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

export IGNORE_A11Y = true

# Environment variables
# ---------------------

# TODO increase this as coverage improves
EXPECTED_COVERAGE = 48


# Verify tasks
# ------------

verify-coverage:
	@nyc check-coverage --lines $(EXPECTED_COVERAGE) --functions $(EXPECTED_COVERAGE) --branches $(EXPECTED_COVERAGE)
	@$(DONE)


# Test tasks
# ----------

test: verify unit-test-coverage verify-coverage
	@$(DONE)

unit-test:
	@NODE_ENV=test node_modules/.bin/mocha test/unit --recursive || echo "NOTE: Unit tests must be run under Node v6.x due to mitm dev dependency (TODO: Fix this - see README for more details)"
	@$(DONE)

unit-test-coverage:
	@NODE_ENV=test nyc --reporter=text --reporter=html node_modules/.bin/mocha test/unit --recursive
	@$(DONE)

# TODO this doesn't work and isn't _technically_
# an integration test. Revisit this
test-integration:
	export DEBUG=graphite; node examples/app.js
