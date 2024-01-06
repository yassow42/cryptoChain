import React from "react";


const Transaction = ({ transaction }) => {

   // console.log(transaction);

    const { input, outputMap } = transaction;
  //  console.log(outputMap);
    const recipients = Object.keys(outputMap);

    return (
        <div>

            <div>From: {`${input.address.substring(0, 15)}...`} | Balance: {`${input.amount}`} </div>
            {
                recipients.map(recipient => {
                    return (
                        <div key={recipient}>
                            To: {`${recipient.substring(0, 15)}...`} | Sent: {outputMap[recipient]}
                        </div>
                    );
                })
            }
        </div>
    );
}

export default Transaction;