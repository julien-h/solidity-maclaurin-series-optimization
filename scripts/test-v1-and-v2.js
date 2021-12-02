// This script compares the output and gas costs of the baseline contract and 
// both optimized v1 and optmized v2
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
  const baselineContract = await hre.ethers.getContractFactory("MBTestBaseline");
  const baseline = await baselineContract.deploy();

  const optimizedContract1 = await hre.ethers.getContractFactory("MBTestOptimized1");
  const optimized1 = await optimizedContract1.deploy();

  const optimizedContract2 = await hre.ethers.getContractFactory("MBTestOptimized2");
  const optimized2 = await optimizedContract2.deploy();

  await baseline.deployed();
  await optimized1.deployed();
  await optimized2.deployed();

  console.log("Baseline contract deployed to:", baseline.address);
  console.log("Optimized1 contract deployed to:", optimized1.address);
  console.log("Optimized2 contract deployed to:", optimized2.address);

  let iTestCase = 0;
  let day = 250;
  let invRate = 2;
  let decimals = "1000000000000000000";
  console.log('\nBatch 1: v1 vs baseline:');
  for (let precision = 1; precision <= 23; ++precision) {
    await utils.runComparison(baseline, optimized1, precision, decimals, invRate, day, 365, precision)
  }
  console.log('\nBatch 2: v2 vs v1');
  for (let precision = 1; precision <= 50; ++precision) {
    await utils.runComparison(optimized1, optimized2, precision, decimals, invRate, day, 365, precision)
  }
  
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
