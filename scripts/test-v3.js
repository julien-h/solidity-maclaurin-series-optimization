// This script compares the output and gas costs of the baseline contract and optmized v3
//
const { BigNumber } = require("@ethersproject/bignumber");
const hre = require("hardhat");
const utils = require("./utils");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const baselineContract = await hre.ethers.getContractFactory(
    "MBTestBaseline"
  );
  const baseline = await baselineContract.deploy();

  const optimizedContract = await hre.ethers.getContractFactory(
    "MBTestOptimized3"
  );
  const optimized = await optimizedContract.deploy();

  await baseline.deployed();
  await optimized.deployed();

  console.log("Baseline contract deployed to:", baseline.address);
  console.log("Optimized contract deployed to:", optimized.address);

  let iTestCase = 0;
  let decimals = "1000000000000000000";
  for (let day = 1; day <= 365; day += 3) {
    for (let invRate = 2; invRate <= 10; invRate += 2) {
      for (let precision = 1; precision <= 21; precision += 2) {
        await utils.runComparison_(
          (k, x, a, b, p) => utils.runTestCase(baseline, k, x, a, b, p),
          (k, x, a, b, p) => utils.runTestCaseV3(optimized, k, x, a, b, p),
          iTestCase,
          decimals,
          invRate,
          day,
          365,
          precision
        );
        iTestCase += 1;
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
