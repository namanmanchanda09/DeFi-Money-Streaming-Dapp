const hre = require("hardhat");

async function main(){
    const [sender, sender2, recipient, recipient2] = await ethers.getSigners();

    const sablierContractFactory = await hre.ethers.getContractFactory("Sablier");
    const sablierContract = await sablierContractFactory.deploy();
    await sablierContract.deployed();
    console.log(`Contract deployed to : ${sablierContract.address}`);

    const tokenContractFactory = await hre.ethers.getContractFactory("Token");
    const tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployed();
    console.log(`Contract deployed to : ${tokenContract.address}`);

    const deposit = "2999999999999998944000"; // almost 3,000, but not quite
    const now = Math.round(new Date().getTime() / 1000); // get seconds since unix epoch
    const startTime = now + 3600; // 1 hour from now
    const stopTime = now + 2592000 + 3600; // 30 days and 1 hour from now

    const approveTx = await tokenContract.approve(sablierContract.address, deposit); // approve the transfer
    await approveTx.wait();

    // Minting tokens to sender2
    const mintTokens = await tokenContract.connect(sender2).mint();
    await mintTokens.wait();

    const senderOneBalance = await tokenContract.balanceOf(sender.address);
    const senderTwoBalance = await tokenContract.balanceOf(sender2.address);

    console.log(`balance of tokens in sender one ${parseInt(senderOneBalance)}`);
    console.log(`balance of tokens in sender two ${parseInt(senderTwoBalance)}`);

    // Create stream 1
    const createStreamTx = await sablierContract.callStatic.createStream(recipient.address, deposit, tokenContract.address, startTime, stopTime);
    let streamId = parseInt(createStreamTx);
    console.log(streamId);
}

main()
.then(()=>process.exit(0))
.catch((err)=>{
    console.log(err);
    process.exit(1);
})





