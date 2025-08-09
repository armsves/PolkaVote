// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ModArithmetic {
    uint256 public immutable generator;
    uint256 public immutable modulus;

    constructor(uint256 _generator, uint256 _modulus) {
        require(_modulus > 0, "Modulus must be > 0");
        require(_generator > 0 && _generator < _modulus, "Invalid generator");

        generator = _generator;
        modulus = _modulus;
    }

    function modAdd(uint256 a, uint256 b) public view returns (uint256) {
        return addmod(a, b, modulus);
    }

    function modSub(uint256 a, uint256 b) public view returns (uint256) {
        return addmod(a, modulus - b % modulus, modulus);
    }

    function modMul(uint256 a, uint256 b) public view returns (uint256) {
        return mulmod(a, b, modulus);
    }

    function modInv(uint256 a) public view returns (uint256) {
        // Fermat's little theorem: a^(p-2) ≡ a⁻¹ mod p for prime p
        require(a != 0 && a < modulus, "Invalid inverse");
        return modExp(a, modulus - 2);
    }

    function modDiv(uint256 a, uint256 b) public view returns (uint256) {
        return modMul(a, modInv(b));
    }

    function modExp(uint256 base, uint256 exponent) public view returns (uint256 result) {
        result = 1;
        base = base % modulus;

        while (exponent > 0) {
            if (exponent % 2 == 1) {
                result = mulmod(result, base, modulus);
            }
            base = mulmod(base, base, modulus);
            exponent /= 2;
        }
    }
}
