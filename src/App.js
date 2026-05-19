import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import QrReader from "react-qr-scanner";

const contractAddress = "0xd9145CCE52D386f254917e481eB44e9943F39138";

const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "string", "name": "_event", "type": "string" }
    ],
    "name": "addEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_manufacturer", "type": "string" }
    ],
    "name": "registerProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "getProduct",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [productId, setProductId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [productData, setProductData] = useState(null);
  const [verified, setVerified] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setStatusMessage("MetaMask not detected. Please install MetaMask.");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const scanSure = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(scanSure);
          setAccount(accounts[0].address);
          setStatusMessage("Wallet connected.");
        } else {
          setStatusMessage("Connect MetaMask to verify products.");
        }
      } catch (error) {
        console.error(error);
        setStatusMessage("Unable to initialize wallet.");
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatusMessage("MetaMask not detected. Please install MetaMask.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const scanSure = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(scanSure);
      setAccount(signer.address);
      setStatusMessage("Wallet connected.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Wallet connection was cancelled or failed.");
    }
  };

  const verifyProduct = async () => {
    try {
      if (!contract) {
        setStatusMessage("Please connect your wallet first.");
        return;
      }

      if (!productId.trim()) {
        setStatusMessage("Please enter or scan a product ID.");
        return;
      }

      const data = await contract.getProduct(productId.trim());
      const isValid = Boolean(data?.[0] && data?.[1]);
      setVerified(isValid);
      setStatusMessage(isValid ? "Product verified." : "Product not found.");

      if (isValid) {
        setProductData({
          name: data[0],
          manufacturer: data[1],
          history: data[2] || []
        });
      } else {
        setProductData(null);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Error verifying product. Check blockchain connection.");
    }
  };

  const generateQR = async () => {
    if (!productId.trim()) {
      setStatusMessage("Enter a product ID before generating QR.");
      return;
    }

    const link = `https://scansure.io/verify/${productId.trim()}`;
    const qr = await QRCode.toDataURL(link);
    setQrCode(qr);
    setStatusMessage("QR generated.");
  };

  const handleScan = (result) => {
    if (result?.text) {
      const id = result.text.split("/").pop();
      setProductId(id || "");
      setStatusMessage("QR scanned. Product ID filled.");
    }
  };

  return (
    <div style={styles.container}>
      <h1>ScanSure Product Verifier</h1>
      <p>
        {account ? `Wallet: ${account.slice(0, 6)}...${account.slice(-4)}` : "Wallet not connected"}
      </p>
      <button onClick={connectWallet} style={{ marginBottom: "12px" }}>
        {account ? "Reconnect Wallet" : "Connect Wallet"}
      </button>

      <input
        style={styles.input}
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        placeholder="Enter or Scan Product ID"
      />

      <div style={styles.buttonGroup}>
        <button onClick={verifyProduct}>Verify Product</button>
        <button onClick={generateQR}>Generate QR</button>
      </div>

      {qrCode && (
        <div>
          <h3>Generated QR Code:</h3>
          <img src={qrCode} alt="QR" width="200" />
        </div>
      )}

      <h3>Scan Product QR</h3>
      <div style={{ width: "250px", margin: "auto" }}>
        <QrReader
          onScan={handleScan}
          onError={(error) => console.error(error)}
          delay={300}
          constraints={{ facingMode: "environment" }}
        />
      </div>

      {statusMessage && <p style={{ marginTop: "12px", color: "#333" }}>{statusMessage}</p>}

      {verified !== null && (
        <div style={styles.result}>
          {verified ? (
            <>
              <h2 style={{ color: "green" }}>Authentic Product</h2>
              <p><b>Name:</b> {productData?.name}</p>
              <p><b>Manufacturer:</b> {productData?.manufacturer}</p>
              <p><b>History:</b></p>
              <ul>
                {productData?.history.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <h2 style={{ color: "red" }}>Fake / Unregistered Product</h2>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { textAlign: "center", fontFamily: "Poppins, sans-serif", padding: "30px" },
  input: { padding: "10px", width: "60%", borderRadius: "8px", marginBottom: "15px" },
  buttonGroup: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "15px" },
  result: { background: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 6px #ccc" }
};

export default App;
