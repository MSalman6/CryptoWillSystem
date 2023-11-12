import { useEffect, useState } from "react";
import blockChainService from "../services/blockChainService";
import BigNumber from 'bignumber.js';
import "./styles/beneficiary.css";
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const Beneficiary = ({account, provider}) => {
    const [claimableWills, setClaimableWills] = useState([]);

    const getClaimableWills = async() => {
        setInterval(async () => {
            const cWills = await blockChainService.getClaimableWillIds(account, provider);
            if(cWills && cWills.length > 0) setClaimableWills(cWills);
        }, 1000);
    }

    const claimWill = async(willId) => {
        await blockChainService.claimWill(account, provider, willId);
    }

    useEffect(() => {
        getClaimableWills();
    }, [account, provider])

    return (
        <div className="beneficiaryContainer">
            <h2>Your Inheritances</h2>

            <div className="will-list">
                
                {
                    claimableWills.length > 0 ? claimableWills.map((item, i) => (
                        <div key={i} className="will-list-item">
                            <div className="text-section">
                                <p>{`From: ${item.testator}`}</p>
                                <p>{`Amount: ${BigNumber(item.amount).dividedBy(Math.pow(10, 18)).toString()} Ether`}</p>
                                <p>{`Claimed: ${item.claimed}.`}</p>
                            </div>

                            {
                                item.isClaimable && !item.claimed ? 
                                    <button onClick={() => claimWill(item.willId)}>
                                        Claim
                                    </button>
                                : <></>
                            }
                        </div>
                    )) : <p>Please connect your wallet.</p>
                }
                
            </div>

        </div>
    );
}

export default Beneficiary;