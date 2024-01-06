import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Transaction from "./Transaction";


class Block extends Component {

    state = { displayTransaction: false };

    toggleTransaction = () => {
        // console.log(this.state.displayTransaction);
        this.setState({ displayTransaction: !this.state.displayTransaction });
    }
    get displayTransaction() {
        const { data } = this.props.block;

        const stringifiedData = JSON.stringify(data);
        //console.log(data);

        const dataDisplay = stringifiedData.length > 15 ?
            `${stringifiedData.substring(0, 15)}...` :
            stringifiedData


        if (this.state.displayTransaction) {
            return (
                <div className="Transaction" >
                    {
                        //    console.log(data)
                    //    data.map(transaction => (console.log(transaction)))

                    }
                    {
                        data.map(transaction => (
                            <div key={transaction.id}>
                                <hr />
                                <Transaction transaction={transaction} />

                            </div>


                        ))
                    }
                    <br />
                    <Button
                        
                        onClick={this.toggleTransaction}
                    >
                        Show Less
                    </Button>
                </div>
            );
        }
        return (
            <div>
                <div>Data: {dataDisplay}</div>
                <Button
                    bsStyle="danger"
                    bsSize="small"
                    onClick={this.toggleTransaction}
                >
                    Show More
                </Button>
            </div>);
    }


    render() {
        const { timestamp, hash, nonce, difficulty } = this.props.block;
        const hashDisplay = `${hash.substring(0, 15)}...`;

        return (
            <div className="Block" >

                <div> Hash: {hashDisplay}</div>
                <div> Nonce: {nonce}  Difficulty: {difficulty}</div>
                <div> Timestamp: {new Date(timestamp).toLocaleString()}</div>

                {this.displayTransaction}

            </div>
        );

    }
}
export default Block;