import './App.css';
import Web3 from "web3";
import { useState } from 'react';
import Web3Modal from "web3modal";
import Testator from './components/Testator';
import Beneficiary from './components/Beneficiary';
import WalletConnectProvider from "@walletconnect/web3-provider";

function App() {
  const [userType, setUserType] = useState(null);
  const [web3Account, setWeb3Account] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);

  const connectWallet = async () => {
    try {
      const rpc = process.env.REACT_APP_CHAIN_RPC;
      const chainId = process.env.REACT_APP_CHAIN_ID;
  
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {rpc: {chainId: rpc}}
        }
      };
  
      const web3Modal = new Web3Modal({
        network: process.env.REACT_APP_NETWORK, // optional
        cacheProvider: false, // optional
        providerOptions // required
      });

      web3Modal.clearCachedProvider();
      const web3ModalInstance = await web3Modal.connect();

      // handle account change
      const classInstance = this;
      web3ModalInstance.on('accountsChanged', function (accounts) {
        if(accounts.length === 0) {
          window.location.reload();
        } else {
          classInstance.connectWallet();
        }
      })

      const provider = new Web3(web3ModalInstance)

      if (web3ModalInstance.networkVersion !== chainId) {
        try {
          await web3ModalInstance.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: new Web3().utils.toHex(chainId) }]
          });
        } catch(err) {
          if (err.code === 4902) {
            // await web3ModalInstance.request({
            //   method: 'wallet_addEthereumChain',
            //   params: [
            //     {
            //       chainName: 'DMD',
            //       chainId: new Web3().utils.toHex(chainId),
            //       nativeCurrency: { name: 'DMD', decimals: 18, symbol: 'DMD' },
            //       rpcUrls: [process.env.REACT_APP_REACT_APP_URL]
            //     }
            //   ]
            // });
          } else {
            console.log("Other Error", err)
            return undefined;
          }
        }
      }

      setWeb3Provider(provider);
      setWeb3Account(web3ModalInstance.selectedAddress);

      return provider;
    } catch(err) {
      console.log(err)
    }
  }

  return (
    <>

      <header>
        {
          userType ? <button className="back-button" onClick={e => setUserType(null)}>Back</button> : <></>
        }
        <h1 className="title">Crypto Will System</h1>
        {
          web3Account ? <button className='connectWalletBtn'>{web3Account}</button> : <button className='connectWalletBtn' onClick={connectWallet}>Connect Wallet</button>
        }
      </header>

      <div className="container">
        {
          userType ? userType == 'testator' ? <Testator account={web3Account} provider={web3Provider} /> : <Beneficiary account={web3Account} provider={web3Provider} />
            :
            <>
              <div className="userTypeBtn" onClick={e => setUserType("testator")}>Testator</div>
              <div className="userTypeBtn" onClick={e => setUserType("beneficiary")}>Beneficiary</div>
            </>

        }
      </div>

    </>
  );
}

export default App;
