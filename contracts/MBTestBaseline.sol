// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./SafeMath.sol";

contract MBTestBaseline {
    using SafeMath for uint256;

    /**
    @dev    Main Function. Used to calculate mcLaurinBinomial.
    @param  k - coefficient that numerator and denominator need to be multiplied by
                in order to avoid value that is less than 1.
    @param  x - main variable.
    @param  a - power numerator.
    @param  b - power denominator.
    @param  prec - precision as the amount of elements in a row.
    */
    function maclaurinBinomial(
        uint256 k,
        uint256 x,
        uint256 a,
        uint256 b,
        uint256 prec
    ) internal pure returns (uint256 total) {
        total = 0;
        // for each element in a row
        for (uint256 i = 0; i < prec; i++) {
            // get binomial coefficient
            (uint256 numerator, uint256 denominator, uint256 sign) = getCoefficient(i, x, a, b);

            // calculate full value
            uint256 fullValue = k.mul(numerator).div(denominator);

            // sign: 1 is '+', 0 is '-'
            if (sign == 1) {
                total = total.add(fullValue);
            } else {
                total = total.sub(fullValue);
            }
        }
    }

    /**
    @dev    Calculates factorial.
    @param  factor - number for calculating factorial.
    */
    function factorial(uint256 factor) private pure returns (uint256 x) {
        x = 1;
        for (uint256 i = 1; i <= factor; i++) {
            x = x.mul(i);
        }
    }

    /**
    @dev    Calculates binomial coefficient for the element in a row.
            Returns (numerator, denominator, sign).
    @param  i - number of the element.
    @param  x - number to get powered.
    @param  a - power numerator.
    @param  b - power denominator.
    */
    function getCoefficient(
        uint256 i,
        uint256 x,
        uint256 a,
        uint256 b
    )
        private
        pure
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        if (i == 0) {
            return (1, 1, 1);
        } else if (i == 1) {
            // first coefficient is k*(a/b)
            return (a, x.mul(b), 1);
        } else {
            /*
             * 0 - xPowered
             * 1 - bPowered
             * 2 - factored
             * 3 - denominator
             * 4 - sign
             * 5 - numerator
             */
            uint256[6] memory locals = [x**i, b**i, factorial(i), 0, 0, 0];
            // denominator = xPowered * factorial * bPowered
            locals[3] = locals[0].mul(locals[2]).mul(locals[1]);
            // sign = (i - 1) % 2 is zero or not
            locals[4] = i.sub(1) % uint256(2) == 0 ? 1 : 0;
            // for the first element
            locals[5] = a;
            for (uint256 n = 2; n <= i; n++) {
                // numerator = numerator * ((n - 1) * b - a)
                locals[5] = locals[5].mul(n.sub(1).mul(b).sub(a));
            }
            return (locals[5], locals[3], locals[4]);
        }
    }

    function calcExponential(
        uint256 k,
        uint256 x,
        uint256 a,
        uint256 b,
        uint256 prec
    ) public pure returns (uint256) {
        return maclaurinBinomial(k, x, a, b, prec);
    }
}
