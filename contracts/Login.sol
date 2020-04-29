pragma solidity >= 0.5.0 < 0.7.0;

contract Login {
  constructor() public {
  }

  // Login event
  event LoginAttempt(
      address sender,
      string challenge
  );

  function login(string memory challenge) public {
    emit LoginAttempt(msg.sender, challenge);
  }
}
