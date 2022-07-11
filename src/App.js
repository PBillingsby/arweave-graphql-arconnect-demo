import './App.css';
import { useState } from 'react';
import Arweave from 'arweave';
import { recipientQuery, ownersQuery } from './api/queries';

function App() {
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });

  const [wallets, setWallets] = useState([]);
  const [recipientTxns, setRecipientTxns] = useState();
  const [ownersTxns, setOwnersTxns] = useState();
  const [currentAddress, setCurrentAddress] = useState();

  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const connect = async () => {
    setIsLoading(true);
    try {
      await window.arweaveWallet.connect("ACCESS_ALL_ADDRESSES");
    }
    catch (error) {
      setError(`${error.message}. Refresh to try again.`);
    }
    const addresses = await window.arweaveWallet.getAllAddresses();
    setWallets(addresses);
    setIsLoading(false);
  }

  const handleChange = async (e) => {
    const address = e.target.value;
    setCurrentAddress(address);
  }

  const handleQuery = async (condition) => {
    setIsLoading(true);
    const isRecipient = condition === "recipient";
    const queryFunc = isRecipient ? recipientQuery : ownersQuery;
    setOwnersTxns();
    setRecipientTxns();
    try {
      const query = queryFunc(currentAddress);
      const results = await arweave.api.post(`graphql`, query)
        .catch(err => {
          console.error('GraphQL query failed');
          throw new Error(err);
        });
      const edges = results.data.data.transactions.edges;
      isRecipient ? setRecipientTxns(edges) : setOwnersTxns(edges);
      setIsLoading(false);
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      {!!wallets.length &&
        <div>
          <select style={{ width: "25rem", margin: "15px" }} onChange={(e) => handleChange(e)}>
            <option style={{ textAlign: "center" }} disabled>{wallets.length ? "-- select wallet --" : "loading..."}</option>
            {wallets && wallets.map(address => {
              return <option value={address}>{address}</option>
            })}
          </select>
          <button onClick={() => handleQuery("recipient")}>get incoming txns</button>
          <button onClick={() => handleQuery("owners")}>get outgoing txns</button>
        </div>
      }
      {(!wallets.length && !isLoading) && <button style={{ marginTop: "1rem" }} onClick={() => connect()}>Connect</button>}

      <div style={{ display: "block" }}>{error && <p style={{ color: "red" }}>{error}</p>}</div>
      <div style={containerStyle}>
        {isLoading && <p style={{ textAlign: "center" }}>...loading</p>}
        {recipientTxns && (
          (<div>
            <h3>Recipient Transactions</h3>
            {recipientTxns.map(txn => {
              return (
                <div style={txnStyle}>
                  <p><strong>Receiver:</strong> {txn.node.owner.address}</p>
                  <p><strong>Amount:</strong> {txn.node.quantity.ar} $AR</p>
                  <p><strong>Fee:</strong> {txn.node.fee.ar} $AR</p>
                  {txn.node.tags.length && <p><strong>Tags:</strong> {JSON.stringify(txn.node.tags)}</p>}
                  <p><strong>Link:</strong> <a href={`https://viewblock.io/arweave/tx/${txn.node.id}`} target="_blank">{`https://viewblock.io/arweave/tx/${txn.node.id}`}</a></p>
                </div>
              )
            })}
          </div>)
        )}

        {ownersTxns && (
          <div>
            <h3>Owner Transactions</h3>
            {ownersTxns.map(txn => {
              return (
                <div style={txnStyle}>
                  <p><strong>Amount:</strong> {txn.node.quantity.ar} $AR</p>
                  <p><strong>Fee:</strong> {txn.node.fee.ar} $AR</p>
                  {!!txn.node.tags.length && <p><strong>Tags:</strong> {JSON.stringify(txn.node.tags).split(",").join('\n')}</p>}
                  <p><strong>Link:</strong> <a href={`https://viewblock.io/arweave/tx/${txn.node.id}`} target="_blank">{`https://viewblock.io/arweave/tx/${txn.node.id}`}</a></p>
                </div>
              )
            })}
          </div>)
        }
      </div>
    </div>
  )
}

export default App

const containerStyle = { display: "flex", gap: "8rem", justifyContent: "center", maxHeight: "80vh", overflow: "scroll" }
const txnStyle = { maxWidth: "30vw", textAlign: "left", padding: "10px", border: "1px solid black", marginBottom: "15px", overflow: "scroll" }