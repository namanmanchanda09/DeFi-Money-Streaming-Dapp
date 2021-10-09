const hre = require("hardhat");

async function main() {

  const sablierContractFactory = await hre.ethers.getContractFactory("Sablier");
  const sablierContract = await sablierContractFactory.deploy();
  await sablierContract.deployed();
  console.log(`Contract deployed to : ${sablierContract.address}`);

  const tokenContractFactory = await hre.ethers.getContractFactory("Token");
  const tokenContract = await tokenContractFactory.deploy();
  await tokenContract.deployed();
  console.log(`Contract deployed to : ${tokenContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
