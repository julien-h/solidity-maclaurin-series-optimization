// This script displays the number of correct decimals for each contract
// when compared to the true value.
//
const { BigNumber } = require("@ethersproject/bignumber");
const hre = require("hardhat");

async function call(contract, decimals, invRate, a, b, precision) {
  try {
    return await contract.calcExponential(
      BigNumber.from(decimals),
      BigNumber.from(invRate),
      BigNumber.from(a),
      BigNumber.from(b),
      BigNumber.from(precision)
    );
  } catch (error) {
    return NaN;
  }
}

function findFirstDiff(a, b) {
  var shorterLength = Math.min(a.length, b.length);
  for (var i = 0; i < shorterLength; i++) {
    if (a[i] !== b[i]) return i;
  }
  if (a.length !== b.length) return shorterLength;
  return -1;
}

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

  const optimizedContract1 = await hre.ethers.getContractFactory(
    "MBTestOptimized1"
  );
  const optimized1 = await optimizedContract1.deploy();

  const optimizedContract2 = await hre.ethers.getContractFactory(
    "MBTestOptimized2"
  );
  const optimized2 = await optimizedContract2.deploy();

  await baseline.deployed();
  await optimized1.deployed();
  await optimized2.deployed();

  let a = 250;
  let b = 365;
  let invRate = 2;
  let decimals = "1000000000000000000";
  let trueValue =
    "13201110046196193717850777704475865296594774744103490246734003641";

  for (let precision = 3; precision <= 30; ++precision) {
    const res0 = await call(baseline, decimals, invRate, a, b, precision);
    //const res1 = await call(optimized1, decimals, invRate, a, b, precision);
    const res2 = await call(optimized2, decimals, invRate, a, b, precision);

    console.log(`Precision ${precision}:`);
    console.log(`Baseline output: ${res0}`);
    console.log(`True value:      ${trueValue}`);
    console.log(
      `- baseline--: ${findFirstDiff(String(res0), trueValue)} correct decimals`
    );
    //console.log(`- optimized1: ${findFirstDiff(String(res1), trueValue)}`);
    console.log(
      `- optimized2: ${findFirstDiff(String(res2), trueValue)} correct decimals`
    );
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
