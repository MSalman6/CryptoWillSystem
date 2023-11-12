// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract CryptoWillSystem {
    address owner;
    uint256 public willId;

    struct Will {
        bool claimed;
        uint256 amount;
        address testator;
        bool isClaimable;
        address beneficiary;
        uint256 createdAt;
    }

    mapping(uint256 => Will) public wills;
    mapping(address => uint256[]) testatorWillIds;

    mapping(uint256 => uint256) public beneficiaryWillIndex;
    mapping(address => uint256[]) public beneficiaryClaimedWills;
    mapping(address => uint256[]) public beneficiaryUnClaimedWills;

    event WillClaimed(address indexed testator, address benifiary, uint256 amount, uint256 claimedAt);
    event WillCreated(address indexed testator, address[] beneficiaries, uint256[] amounts, uint256 createdAt);

    receive() external payable {}
    constructor() {owner = msg.sender;}

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this method");
        _;
    }

    modifier onlyBeneficiary(uint256 _willId) {
        require(wills[_willId].beneficiary == msg.sender, "Not beneficiary of the will");
        _;
    }

    function createWill(address[] memory beneficiaries, uint256[] memory amounts) external payable {
        require(beneficiaries.length == amounts.length, "Invalid input lengths");
        uint256 totalEthAmount;
        for (uint256 i; i<beneficiaries.length; i++) {
            willId++;
            wills[willId] = Will(
                false,
                amounts[i],
                msg.sender,
                false,
                beneficiaries[i],
                block.timestamp
            );
            totalEthAmount += amounts[i];
            testatorWillIds[msg.sender].push(willId);
            beneficiaryUnClaimedWills[beneficiaries[i]].push(willId);
            beneficiaryWillIndex[willId] = beneficiaryUnClaimedWills[beneficiaries[i]].length - 1;
        }
        require(totalEthAmount <= msg.value, "Not enough ether sent");
        emit WillCreated(msg.sender, beneficiaries, amounts, block.timestamp);
    }

    function claimWill(uint256 _willId) external onlyBeneficiary(_willId) {
        Will storage willData = wills[_willId];
        require(!willData.claimed, "Will already claimed");
        require(willData.isClaimable, "Will is not claimable");

        willData.claimed = true;
        willData.isClaimable = false;

        beneficiaryUnClaimedWills[willData.beneficiary][beneficiaryWillIndex[_willId]] = beneficiaryUnClaimedWills[willData.beneficiary][beneficiaryUnClaimedWills[willData.beneficiary].length - 1];
        beneficiaryUnClaimedWills[willData.beneficiary].pop();
        beneficiaryClaimedWills[willData.beneficiary].push(_willId);

        (bool success, ) = willData.beneficiary.call{value: willData.amount}("");
        require(success, "Ether transfer failed");

        emit WillClaimed(willData.testator, willData.beneficiary, willData.amount, block.timestamp);
    }

    function getTestatorWillIds(address testator) external view returns(uint256[] memory) {
        return testatorWillIds[testator];
    }

    function getWillDetails(uint256 _willId) external view returns(bool claimed, bool isClaimable, address testator, uint256 amount, address beneficiary, uint256 createdAt) {
        Will memory willData = wills[_willId];
        return (
            willData.claimed,
            willData.isClaimable,
            willData.testator,
            willData.amount,
            willData.beneficiary,
            willData.createdAt
        );
    }

    function getClaimableWillsIds(address beneficiary) external view returns(uint256[] memory) {
        return beneficiaryUnClaimedWills[beneficiary];
    }

    function getClaimedWillsIds(address beneficiary) external view returns(uint256[] memory) {
        return beneficiaryClaimedWills[beneficiary];
    }

    function setWillIsClaimableStatus(uint256 _willId, bool status) external onlyOwner {
        wills[_willId].isClaimable = status;
    }
}
