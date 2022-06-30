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
  const [recipientTxns, setRecipientTxns] = useState()
  const [ownersTxns, setOwnersTxns] = useState()
  const [currentAddress, setCurrentAddress] = useState()
  const [error, setError] = useState()

  const connect = async () => {
    try {
      await window.arweaveWallet.connect("ACCESS_ALL_ADDRESSES")
    }
    catch (error) {
      setError(`${error.message}. Refresh to try again.`)
    }
    const addresses = await window.arweaveWallet.getAllAddresses();
    setWallets(addresses);
  }

  const handleChange = async (e) => {
    const address = e.target.value;
    setCurrentAddress(address)
  }

  const getTransactions = () => {
    handleQuery("recipient");
    handleQuery("owners");
  }

  const handleQuery = async (condition) => {
    const isRecipient = condition === "recipient"
    const queryFunc = isRecipient ? recipientQuery : ownersQuery
    try {
      const query = queryFunc(currentAddress);
      const results = await arweave.api.post(`graphql`, query)
        .catch(err => {
          console.error('GraphQL query failed');
          throw new Error(err);
        });
      const edges = results.data.data.transactions.edges;
      isRecipient ? setRecipientTxns(edges) : setOwnersTxns(edges);
    }
    catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="App">
      <div>
        <select style={{ width: "25rem", margin: "0 auto", margin: "15px" }} onChange={(e) => handleChange(e)}>
          <option style={{ textAlign: "center" }} disabled>{wallets.length ? "-- select wallet --" : "loading..."}</option>
          {wallets && wallets.map(address => {
            return <option value={address}>{address}</option>
          })}
        </select>
        <button onClick={() => getTransactions()}>get txns</button>
      </div>
      {!wallets.length && <button style={{ marginTop: "1rem" }} onClick={() => connect()}>Connect</button>}
      <div style={{ display: "block" }}>{error && <p style={{ color: "red" }}>{error}</p>}</div>
      <div style={{ display: "flex", gap: "15rem", margin: "0 auto", maxHeight: "80vh", overflow: "scroll" }}>
        {recipientTxns && (
          <div>
            <h3>Received Transactions</h3>
            {recipientTxns.map(txn => {
              return (
                <div style={{ maxWidth: "40vw", textAlign: "left", padding: "10px", border: "1px solid black", marginBottom: "15px", overflow: "scroll" }}>
                  <p><strong>Sender:</strong> {txn.node.owner.address}</p>
                  <p><strong>Amount:</strong> {txn.node.quantity.ar} $AR</p>
                  <p><strong>Fee:</strong> {txn.node.fee.ar} $AR</p>
                  {txn.node.tags.length && <p><strong>Tags:</strong> {JSON.stringify(txn.node.tags)}</p>}
                  <p><strong>Link:</strong> <a href={`https://viewblock.io/arweave/tx/${txn.node.id}`} target="_blank">{`https://viewblock.io/arweave/tx/${txn.node.id}`}</a></p>
                </div>
              )
            })}
          </div>
        )}

        {ownersTxns && (
          <div>
            <h3>Sent Transactions</h3>
            {ownersTxns.map(txn => {
              return (
                <div style={{ maxWidth: "40vw", textAlign: "left", padding: "10px", border: "1px solid black", marginBottom: "15px", overflow: "scroll" }}>
                  <p><strong>Receiver:</strong> {txn.node.recipient}</p>
                  <p><strong>Amount:</strong> {txn.node.quantity.ar} $AR</p>
                  <p><strong>Fee:</strong> {txn.node.fee.ar} $AR</p>
                  {!!txn.node.tags.length && <p><strong>Tags:</strong> {JSON.stringify(txn.node.tags).split(",").join('\n')}</p>}
                  <p><strong>Link:</strong> <a href={`https://viewblock.io/arweave/tx/${txn.node.id}`} target="_blank">{`https://viewblock.io/arweave/tx/${txn.node.id}`}</a></p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div >
  )
}

export default App;
