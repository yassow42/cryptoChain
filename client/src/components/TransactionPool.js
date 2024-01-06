import React, { Component } from "react";
import { FormGroup, FormControl, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Transaction from "./Transaction";
import history from "../history";

const POOL_INTERVAL_MS = 11000;

class TransactionPool extends Component {
    state = { transactionPoolMap: {} };

    fetchTransactionPoolMap = () => {
        fetch(`${document.location.origin}/api/transaction-pool-map`)
            .then(response => response.json())
            .then(json => {
                this.setState({ transactionPoolMap: json })
            });
    }
    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
            .then(response => {
                if (response.status === 200) {
                    alert("succesfuly");
                    history.push('/blocks');
                } else {
                    alert('The mine-transactions block request did not complete.');
                }
            }

            );

    }
    componentDidMount() {
        this.fetchTransactionPoolMap();

        this.fetchPoolMapInterval = setInterval(() => {
            this.fetchTransactionPoolMap();
        }, POOL_INTERVAL_MS);
    }

    componentWillUnmount() {
        clearInterval(this.fetchPoolMapInterval);
    }


    render() {
        return (
            <div className="TransactionPool" >
                <div>
                    <Link to='/'> Go Home</Link>
                    <h3> Transaction Pool</h3>
                </div>

                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                        return (
                            <div key={transaction.id}>
                                <hr />
                                <Transaction transaction={transaction} />
                            </div>
                        )
                    })
                }

                <hr></hr>

                <Button onClick={this.fetchMineTransactions}> Mine </Button>
            </div>

        );
    };

}

export default TransactionPool;