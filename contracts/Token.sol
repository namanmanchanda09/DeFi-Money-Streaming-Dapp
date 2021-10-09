// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    address public minter;

  constructor() payable ERC20("Money Stream Currency", "MSC") {
    minter = msg.sender;
    _mint(msg.sender,9999999999 * 10 ** 18);
  }

  function mint() public {
		_mint(msg.sender, 9999999999 * 10 ** 18);
	}
}





