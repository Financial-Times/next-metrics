include n.Makefile

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

test: verify test-unit-coverage verify-coverage
	@$(DONE)

test-unit:
	@NODE_ENV=test mocha test/unit --recursive
	@$(DONE)

test-unit-coverage:
	@NODE_ENV=test nyc --reporter=text --reporter=html node_modules/.bin/_mocha test/unit --recursive
	@$(DONE)

# TODO this doesn't work and isn't _technically_
# an integration test. Revisit this
test-integration:
	export DEBUG=graphite; node examples/app.js
