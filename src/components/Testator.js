import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import "./styles/testator.css";
import blockChainService from "../services/blockChainService";
import BigNumber from 'bignumber.js';
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });


const Testator = ({account, provider}) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [amounts, setAmounts] = useState([]);
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [prevWills, setPrevWills] = useState([]);

  const getPreviousWills = async () => {
    setInterval(async () => {
        const wills = await blockChainService.getPreviousWills(account, provider);
        if (wills) setPrevWills(wills);
    }, 1000)
  }

  useEffect(() => {
    getPreviousWills();
  }, [account, provider]);

  const addBeneficiary = () => {
    if (beneficiary && amount) {
      // Validate beneficiary as a wallet address
      const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(beneficiary);
  
      if (isWalletAddress) {
        setBeneficiaries([...beneficiaries, beneficiary]);
        setAmounts([...amounts, BigNumber(amount).multipliedBy(Math.pow(10, 18)).toString()]);
        setBeneficiary("");
        setAmount("");
      } else {
        alert("Invalid wallet address");
      }
    }
  };

  const removeBeneficiary = (index) => {
    const updatedBeneficiaries = [...beneficiaries];
    const updatedAmounts = [...amounts];
    updatedBeneficiaries.splice(index, 1);
    updatedAmounts.splice(index, 1);
    setBeneficiaries(updatedBeneficiaries);
    setAmounts(updatedAmounts);
  };

  const createWill = async (e) => {
    e.preventDefault();

    // Perform the blockchain service call with beneficiaries and amounts
    const created = await blockChainService.createWill(provider, account, beneficiaries, amounts);

    if (created) {
        // Clear the form after creating the will
        setBeneficiaries([]);
        setAmounts([]);

        alert("Will created.")
    }
  };

  return (
    <div className="testatorContaier">
      {/* <div className="previousWillsContainer">
        {
            prevWills.length > 0 ? 
            <div className="will-form">
                <h2>Previous Wills</h2>
                {prevWills.map((beneficiary, index) => (
                    <div key={index} className="will-list-item">
                        <div className="text-section">
                            <p>{`Beneficiary: ${prevWills[index].beneficiary}`}</p>
                            <p>{`Amount: ${BigNumber(prevWills[index].amount).dividedBy(Math.pow(10, 18)).toString()} Ether`}</p>
                            <p>{`Claimed: ${prevWills[index].claimed}`}</p>
                        </div>
                    </div>
                ))}
            </div>
            : <></>
        }
      </div> */}

      <div className="newWillContainer">
        <div className="will-form">
          <h2>Create New Will</h2>
          <form>
            <label htmlFor="amount">Amount:</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <label htmlFor="beneficiary">Beneficiary:</label>
            <input
              type="text"
              id="beneficiary"
              name="beneficiary"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              required
            />

            <button type="button" onClick={addBeneficiary}>
              Add
            </button>
          </form>

          {beneficiaries.length > 0 && (
            <h2>Will definition</h2>
          )}
          {beneficiaries.map((beneficiary, index) => (
            <div key={index} className="will-list-item">
                <div className="text-section">
                    <p>{`Beneficiary: ${beneficiary}`}</p>
                    <p>{`Amount: ${BigNumber(amounts[index]).dividedBy(Math.pow(10, 18)).toString()} Ether`}</p>
                </div>
                <button className="close-button" onClick={() => removeBeneficiary(index)}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            ))}

          {beneficiaries.length > 0 && (
            <button onClick={createWill}>Create Will</button>
          )}
        </div>

        {
            prevWills.length > 0 ? 
            <div className="will-form">
                <h2>Will History</h2>
                {prevWills.map((beneficiary, index) => (
                    <div key={index} className="will-list-item">
                        <div className="text-section">
                            <p>{`Beneficiary: ${prevWills[index].beneficiary}`}</p>
                            <p>{`Amount: ${BigNumber(prevWills[index].amount).dividedBy(Math.pow(10, 18)).toString()} Ether`}</p>
                            <p>{`Claimed: ${prevWills[index].claimed}`}</p>
                        </div>
                    </div>
                ))}
            </div>
            : <></>
        }
      </div>
    </div>
  );
};

export default Testator;
