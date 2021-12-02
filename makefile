install:
	yarn install

test1:
	yarn hardhat run scripts/test-v1.js

test2:
	yarn hardhat run scripts/test-v2.js

test3:
	yarn hardhat run scripts/test-v3.js

test4:
	yarn hardhat run scripts/test-v4.js

pdf:
	pandoc README.md -o README.pdf \
	-V colorlinks=true \
	-V linkcolor=blue

.PHONY: test1 test2 pdf install