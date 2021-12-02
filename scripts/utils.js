// Utilities function used to run the tests and prevent duplication between the
// different test files.

const { BigNumber } = require("@ethersproject/bignumber");

/**
 * Computes (computationResult, gasCost) when calling `contract` with the provided arguments.
 * @param {Contract} contract the deployed solidity contract object
 * @param {String} decimal argument passed to the contract
 * @param {Number} reciprocalOfInterestRate argument passed to the contract
 * @param {Number} a argument passed to the contract
 * @param {Number} b argument passed to the contract
 * @param {Number} precision argument passed to the contract
 * @return {List} a tuple of (computationResult, gasCost)
 */
async function runTestCase(
  contract,
  decimal,
  reciprocalOfInterestRate,
  a,
  b,
  precision
) {
  const result = await contract.calcExponential(
    BigNumber.from(decimal),
    BigNumber.from(reciprocalOfInterestRate),
    BigNumber.from(a),
    BigNumber.from(b),
    BigNumber.from(precision)
  );

  const gasCost = await contract.estimateGas.calcExponential(
    BigNumber.from(decimal),
    BigNumber.from(reciprocalOfInterestRate),
    BigNumber.from(a),
    BigNumber.from(b),
    BigNumber.from(precision)
  );
  return [result, gasCost];
}

/**
 * Computes (computationResult, gasCost) for the v3 ABI.
 * @param {Contract} contract the deployed solidity contract object
 * @param {String} decimal argument passed to the contract
 * @param {Number} reciprocalOfInterestRate argument passed to the contract
 * @param {Number} a argument passed to the contract
 * @param {Number} b argument passed to the contract
 * @param {Number} precision argument passed to the contract
 * @return {List} a tuple of (computationResult, gasCost)
 *
 */
async function runTestCaseV3(
  contract,
  decimal,
  reciprocalOfInterestRate,
  a,
  b,
  precision
) {
  const two = BigNumber.from(2);
  const args = BigNumber.from(0)
    .mul(two.pow(128))
    .add(decimal)
    .mul(two.pow(16))
    .add(reciprocalOfInterestRate)
    .mul(two.pow(16))
    .add(a)
    .mul(two.pow(16))
    .add(b)
    .mul(two.pow(16))
    .add(precision);

  const result = await contract.calcExponential(args);
  const gasCost = await contract.estimateGas.calcExponential(args);

  return [result, gasCost];
}

/**
 * Compares the output of `baseline` and `optimized` on the provided arguments.
 * The results are printed on the console output. (Use grep to filter them).
 *
 * @param {Contract} baseline the deployed solidity contract to use as baseline
 * @param {Contract} optimized the deployed solidity contract we want to test
 * @param {Number} iTestCase identifier for this test case
 * @param {String} decimal argument passed to the contracts
 * @param {Number} reciprocalOfInterestRate argument passed to the contracts
 * @param {Number} a argument passed to the contracts
 * @param {Number} b argument passed to the contracts
 * @param {Number} precision argument passed to the contracts
 */
async function runComparison(
  baseline,
  optimized,
  iTestCase,
  decimal,
  reciprocalOfInterestRate,
  a,
  b,
  precision
) {
  return runComparison_(
    (decimal, reciprocalOfInterestRate, a, b, precision) =>
      runTestCase(baseline, decimal, reciprocalOfInterestRate, a, b, precision),
    (decimal, reciprocalOfInterestRate, a, b, precision) =>
      runTestCase(
        optimized,
        decimal,
        reciprocalOfInterestRate,
        a,
        b,
        precision
      ),
    iTestCase,
    decimal,
    reciprocalOfInterestRate,
    a,
    b,
    precision
  );
}
/**
 * Compares the output of `baseline` and `optimized` on the provided arguments.
 * The results are printed on the console output. (Use grep to filter them).
 *
 * @param {Function} baselineCall function to call the baseline contract
 * @param {Function} optimizedCall function to call the optimized contract
 * @param {Number} iTestCase identifier for this test case
 * @param {String} decimal argument passed to the contracts
 * @param {Number} reciprocalOfInterestRate argument passed to the contracts
 * @param {Number} a argument passed to the contracts
 * @param {Number} b argument passed to the contracts
 * @param {Number} precision argument passed to the contracts
 */
async function runComparison_(
  baselineCall,
  optimizedCall,
  iTestCase,
  decimal,
  reciprocalOfInterestRate,
  a,
  b,
  precision
) {
  let baselineError = false;
  let optimizedError = false;
  let baselineResult = 0;
  let baselineGas = 0;
  let optimizedResult = 0;
  let optimizedGas = 0;
  try {
    let data = await baselineCall(
      decimal,
      reciprocalOfInterestRate,
      a,
      b,
      precision
    );
    baselineResult = data[0];
    baselineGas = data[1];
  } catch (error) {
    baselineError = error;
  }
  try {
    let data = await optimizedCall(
      decimal,
      reciprocalOfInterestRate,
      a,
      b,
      precision
    );
    optimizedResult = data[0];
    optimizedGas = data[1];
  } catch (error) {
    optimizedError = error;
  }

  if (baselineError && optimizedError) {
    const same = String(baselineError) == String(optimizedError);
    if (same) {
      console.log(
        `📗 Testcase ${iTestCase} (prec=${precision}): both contracts triggered an error: ${baselineError}`
      );
    } else {
      console.log(
        `📗 Testcase ${iTestCase} (prec=${precision}): both contracts triggered an error:`
      );
      console.log(`- baseline:  ${baselineError}`);
      console.log(`- optimized: ${optimizedError}`);
      console.log("");
    }
  } else if (
    (baselineError && !optimizedError) ||
    (!baselineError && optimizedError)
  ) {
    const prefix =
      baselineError && !optimizedError ? "📙 Difference" : "📕 Error";

    console.log(`${prefix} with test case ${iTestCase} (prec=${precision}):`);
    if (baselineError) {
      console.log(`Baseline triggered this error: ${baselineError}`);
    } else {
      console.log(`Baseline did not trigger an error.`);
    }
    if (optimizedError) {
      console.log(`Optimized triggered this error: ${optimizedError}`);
    } else {
      console.log(`Optimized did not trigger an error.`);
    }
    console.log(
      `Parameters: ${decimal}, ${reciprocalOfInterestRate}, ${a}, ${b}, ${precision}`
    );
    console.log("");
  } else if (baselineResult.eq(optimizedResult)) {
    const gasSaved = optimizedGas.sub(baselineGas);
    const gasSavedRelative = gasSaved.mul(100).div(baselineGas);

    console.log(
      `📗 Testcase ${iTestCase} (prec=${precision}) -EXACT- savings:  ${gasSavedRelative} %  |  ${gasSaved} gas units`
    );
  } else if (baselineResult.sub(optimizedResult).abs() < 99) {
    const diff = baselineResult.sub(optimizedResult).abs();
    const gasSaved = optimizedGas.sub(baselineGas);
    const gasSavedRelative = gasSaved.mul(100).div(baselineGas);
    console.log(
      `📗 Testcase ${iTestCase} (prec=${precision}) EPSILON savings:  ${gasSavedRelative} %  |  ${gasSaved} gas units | delta = ${diff}`
    );
  } else {
    console.log(`📕 Error with test case ${iTestCase} (prec=${precision}):`);
    console.log(`Baseline- result: ${baselineResult}`);
    console.log(`Optimized result: ${optimizedResult}`);
    console.log(
      `Parameters: ${decimal}, ${reciprocalOfInterestRate}, ${a}, ${b}, ${precision}`
    );
    console.log("");
  }
}

module.exports = {
  runComparison,
  runComparison_,
  runTestCase,
  runTestCaseV3,
};
