import './App.css';
import React, { useState } from "react";
import {ethers} from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import sablier_ABI from './artifacts/contracts/Sablier.sol/Sablier.json';
import token_ABI from './artifacts/contracts/Token.sol/Token.json';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [currAccount, setCurrentAccount] = React.useState("");
  const [toAccount,setToAccount] = React.useState("");
  const [stream,setStream] = React.useState(0);
  const [tokenCount, setTokenCount] = React.useState(0);
  const [amount,setAmount] = React.useState(0);
  const [streamId, setStreamId] = React.useState(0);
  const [streamInfo, setStreamInfo] = React.useState([]);
  const [withdrawAmount, setWithdrawAmount] = React.useState(0);
  const [allWaves, setAllWaves] = React.useState([])
  const [startDate, setStartDate] = useState(new Date());
  const sablierContractAddress = `0x5FbDB2315678afecb367f032d93F642f64180aa3`;
  const tokenContractAddress = `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`;
  const sablierABI = sablier_ABI.abi;
  const tokenABI = token_ABI.abi;

  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log(`Make sure you have Metamask!`);
      return;
    } else {
      console.log(`We have the ethereum object`, ethereum);
    }

    ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log(`Found an authorised account : ${account}`)
          setCurrentAccount(account)
        } else {
          console.log(`No authorised account found`)
        }
      })
  }

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert('Get metamask!')
    }
    ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        console.log(`Connected ${accounts[0]}`)
        setCurrentAccount(accounts[0])
      })
      .catch(err => console.log(err));
  }

  const getTokenCount = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenContractAddress,tokenABI,signer);

    const tokenNumber = await tokenContract.balanceOf(`${currAccount}`);
    setTokenCount(parseInt(tokenNumber));

  }

  const getTokens = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenContractAddress,tokenABI,signer);

    const getTokensTx = await tokenContract.mint();
    await getTokensTx.wait();
  }

  const createStream = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);
    const tokenContract = new ethers.Contract(tokenContractAddress,tokenABI,signer);

    const startTime = BigNumber.from(Math.round(new Date().getTime() / 1000) + 60);
    const stopTime = BigNumber.from(Math.round(new Date(startDate).getTime() / 1000));
    const totalSeconds = (stopTime.sub(startTime));
    const amountTemp = (amount*1000000000000000000).toString();
    const streamAmount = BigNumber.from(amountTemp);
    let deposit = streamAmount.sub(streamAmount.mod(totalSeconds));
    deposit = `${deposit}`;

    const approveTx = await tokenContract.approve(sablierContract.address, deposit); // approve the transfer
    await approveTx.wait();

    // Create stream 1
    const createStreamTx = await sablierContract.createStream(toAccount, deposit, tokenContract.address, startTime, stopTime);
    await createStreamTx.wait()

    sablierContract.on("CreateStream",(streamId, adr, recipient, deposit, tokenAddress, startTime, stopTime)=>{
      console.log(parseInt(streamId));
      setStream(streamId);
    });

    console.log(`done`);
  }

  const getStreamDetails = async () =>{
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);
  
      const getStreamTx = await sablierContract.getStream(streamId);
      console.log(getStreamTx);
      let streamDetails = [];
      getStreamTx.forEach((stream)=>{
        streamDetails.push(stream);
      })
  
      setStreamInfo(streamDetails);
      let streamObj ={
        sender:streamDetails[0],
        receiver:streamDetails[1],
        deposit:parseInt(streamDetails[2])
      }
      alert(`The stream waas created by ${streamObj.sender} to ${streamObj.receiver} with a deposit amount of ${streamObj.deposit}`);

    }catch(error){
      alert("This stream might be cancelled or never created.")

    }


  }

  const getAllStreams = async() =>{
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);
  
      const streamMap = await sablierContract.getUserStreamList(currAccount);
      // streamMap.map((stream)=>console.log(parseInt(stream)));
      let wavesCleaned = [];
  
      streamMap.forEach((stream)=>{
        wavesCleaned.push(parseInt(stream));
      });
  
      console.log(wavesCleaned);
      setAllWaves(wavesCleaned);
      console.log(allWaves);

    }catch(e){
      alert("No streams found");
    }

  }

  const getReceivingStreams = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);

    const streamMap = await sablierContract.getStreamRecipientList(currAccount);
    let wavesCleaned = [];

    streamMap.forEach((stream)=>{
      wavesCleaned.push(parseInt(stream));
    });

    console.log(wavesCleaned);
    setAllWaves(wavesCleaned);
    console.log(allWaves);

  }

  const withdrawStream = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);

    const amountTemp = (withdrawAmount * 1000000000000000000).toString();
    let amount = BigNumber.from(amountTemp);
    amount = `${amount}`;

    const withdrawTx = await sablierContract.withdrawFromStream(streamId, amount);
    await withdrawTx.wait()

    alert("SUCCESS - THE AMOUNT WITHDRAWN.");
  }

  const cancelStream = async() =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const sablierContract = new ethers.Contract(sablierContractAddress,sablierABI,signer);

    const cancelTx = await sablierContract.cancelStream(streamId);
    await cancelTx.wait();

    alert(`SUCCESS - STREAMID ${streamId} cancelled.`);
  }



  React.useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  return (

    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header" style={{ color:"rgb(228, 92, 13)"}}>
          DeFi Money Streaming 💸
        </div>
        {
            currAccount ? (<button className="streamButton" onClick={getTokens}>
            Get Tokens
          </button>) : null
          }

        <div className="bio">
          This is a website for streaming money. You can create a stream and send ERC20 tokens to any public address. The recipient can withdraw the calculated tokens anytime within the stream period.<hr />
          <span style={{color:'rgb(59, 13, 228)'}}>You must be connected to Metamask (Rinkeby test network) & have some ERC20 tokens to create a stream.</span>
          <br />
          {
            currAccount ? <h6>Connected to : <span style={{color:"black"}}>{currAccount}</span></h6>: (<button className="streamButton" onClick={connectWallet}>
            Connect Wallet
          </button>)
          }

            {
            currAccount ? (
              <div>
                <input type="text" className="datePicker" onChange={(e)=>setStreamId(e.target.value)} placeholder="Enter stream ID" style={{marginRight:"2px"}}/>
                <input type="text" className="datePicker" onChange={(e)=>setWithdrawAmount(e.target.value)} placeholder="Enter withdraw amount"/><br />
                <button className="streamButton" onClick={getStreamDetails} style={{marginRight:"2px"}}>Get stream details</button>
                <button className="streamButton" onClick={withdrawStream} style={{marginRight:"2px"}}>Withdraw stream</button>
                <button className="streamButton" onClick={cancelStream}>Cancel stream</button>


              </div>
              
            ) : null
          }

          <br />

          {
            currAccount ? (
              <button className="streamButton" onClick={getTokenCount}>Check token Count : {tokenCount}</button>
            ) : null
          }
          
          <br /><br />

        {
            currAccount ? (
              <div>
                Enter the date from now for the stream period<br />
                <DatePicker className="datePicker" selected={startDate} onChange={(date) => setStartDate(date)} /><br /><br />
                Enter the stream amount <br />
                <input type="number" className="datePicker" onChange={(amount)=>setAmount(amount.target.value)}/><br /><br />
                Enter the account to deposit <br />
                <input type="text" className="datePicker" onChange={(e)=>setToAccount(e.target.value)}/><br />
                <button className="streamButton" onClick={createStream}>
                  Create Stream
                </button>
              </div>
            ) : null
          }

        {
            currAccount ? (
              <div>
                <button className="streamButton" onClick={getAllStreams} style={{marginRight:"2px"}}>
                  Get your created streams
                </button>
                <button className="streamButton" onClick={getReceivingStreams}>
                  Get your receiving streams
                </button>
              </div>
            ) : null
          }

        {
          allWaves.map((wave) => {
            return (
              <div style={{ backgroundColor: 'white', marginTop: '16px', padding: '10px', borderRadius: '10px', borderLeftColor: 'orange', borderRightColor: 'green', borderStyle: 'solid', borderTopColor: 'red', borderBottomColor: 'blue' }} key={wave}>
                <div>Address: {wave}</div>
              </div>
            )
          })
        }




        </div>
      </div>
    </div>
  );
}

export default App;


