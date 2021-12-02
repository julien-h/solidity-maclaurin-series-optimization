// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

contract MBTestOptimized4 {

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
        //
        // Note: the if statements are nested on purpuse to optimize for the most likely execution path.
        // Here, the most likely execution path has (prec > 3). It will incur only the cost of testing if(prec <= 3),
        // which is better than incurring the costs of testing every special case for prec==1, prec==2, etc.
        //
        if (prec <= 3) {
            if (prec == 0) {
                return 0;
            }
            else if (prec == 1) {
                return k;
            } else if (prec == 2) {
                return k + ((k * a) / (b * x));
            } else if (prec == 3) {
                //
                // We use special cases until the 3rd term because of the substraction (b-a) which happens only once.
                // Each new factor is then computed by adding b to the numerator.
                // Remark that if we used signed integers, we would only require special cases until the 2nd term.
                //
                // The curse of solidity is that duplication allows for better optimizations... So it's always a tradeoff 
                // between clean DRY code and its optimized counterpart.
                //
                return k
                + ((k * a) / (b*x))
                - ((k * a * (b - a)) / (b*x*2*b*x));
            }
        } else { 
            //
            // most likely execution path: prec>3
            //
            uint256 bx = b * x;
            total = k + ((k * a) / bx);
            
            uint256 factor_numer = b - a;
            uint256 factor_denom = bx + bx;

            //
            // Note: in this version, we do not accumulate the term's numerator
            //       and denominator separately. This saves gas by removing one
            //       variable and removing one multiplication.
            //       This also increases the number of DIV operations, which is
            //       fine since MUL and DIV have the same cost on the EVM.
            //       Actually, using SafeMath, .div is less costly than .mul due
            //       to less checks.
            //
            uint256 term = (k * a * factor_numer) / (bx * factor_denom);
            total -= term;

            for (uint256 i = 4; i <= prec; ++i) {
                factor_numer += b;
                factor_denom += bx;
                term = (term * factor_numer) / factor_denom;
                if (i % uint256(2) == 0) {
                    //
                    // as mentioned earlier, duplication often allows for better optimizations...
                    //
                    total += term;
                } else {
                    total -= term;
                }
            }
        }
    }

  /**
   * @param args arguments packed into a single uint256 as follows:
   *             prec: rightmost 16 bits
   *             b: next 16 bits
   *             a: next 16 bits
   *             x: next 16 bits
   *             k: next 128 bits
   */
  function calcExponential(uint256 args) public pure returns (uint256) {
    uint256 prec = args & uint16(int16(-1));
    args >>= 16;
    uint256 b = args & uint16(int16(-1));
    args >>= 16;
    uint256 a = args & uint16(int16(-1));
    args >>= 16;
    uint256 x = args & uint16(int16(-1));
    args >>= 16;
    uint256 k = args & uint128(int128(-1));
    return maclaurinBinomial(k, x, a, b, prec);
  }
}