import React, { useState } from "react";
import QRCode from "qrcode";
import QrReader from "react-qr-scanner";

const demoProducts = {
  P001: {
    name: "Milk Powder",
    manufacturer: "ScanSure Labs",
    history: ["Product registered", "Packed at Factory", "Shipped to Distributor"]
  },
  P002: {
    name: "Organic Honey",
    manufacturer: "GreenHive Foods",
    history: ["Product registered", "Batch tested", "Delivered to Retail Store"]
  },
  P003: {
    name: "Vitamin C Tablets",
    manufacturer: "HealthCore Pharma",
    history: ["Product registered", "Quality check complete", "Ready for sale"]
  }
};

function App() {
  const [productId, setProductId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [productData, setProductData] = useState(null);
  const [verified, setVerified] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Demo mode active (no MetaMask required).");

  const verifyProduct = () => {
    const cleanId = productId.trim().toUpperCase();

    if (!cleanId) {
      setStatusMessage("Please enter or scan a product ID.");
      return;
    }

    const data = demoProducts[cleanId];
    const isValid = Boolean(data);

    setVerified(isValid);
    setProductData(isValid ? data : null);
    setStatusMessage(isValid ? "Product verified in demo database." : "Product not found in demo database.");
  };

  const generateQR = async () => {
    const cleanId = productId.trim().toUpperCase();
    if (!cleanId) {
      setStatusMessage("Enter a product ID before generating QR.");
      return;
    }

    const qr = await QRCode.toDataURL(cleanId);
    setQrCode(qr);
    setStatusMessage("QR generated.");
  };

  const handleScan = (result) => {
    if (!result) return;

    // Different scanner builds return either a string or an object with text.
    const rawValue =
      typeof result === "string"
        ? result
        : typeof result?.text === "string"
          ? result.text
          : "";

    const raw = rawValue.trim();
    if (!raw) return;

    const id = raw.includes("/") ? raw.split("/").pop() : raw;
    setProductId((id || "").toUpperCase());
    setStatusMessage("QR scanned successfully.");
  };

  return (
    <div style={styles.container}>
      <h1>ScanSure Product Verifier</h1>
      <p style={{ color: "#0b6" }}>Try IDs: P001, P002, P003</p>

      <input
        style={styles.input}
        value={productId}
        onChange={(e) => setProductId(e.target.value.toUpperCase())}
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
          onError={(error) => {
            console.error(error);
            setStatusMessage("Camera/scan error. Allow camera and keep QR steady.");
          }}
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
