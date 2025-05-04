
let walletAddress = "";
let provider = null;

function updateWalletUI() {
  const link = window.location.origin + "/?ref=" + walletAddress;
  document.getElementById("wallet-address").innerText = "Wallet: " + walletAddress;
  document.getElementById("invite-link").innerText = link;
}

async function connectPhantom() {
  try {
    const resp = await window.solana.connect();
    walletAddress = resp.publicKey.toString();
    provider = window.solana;
    updateWalletUI();
  } catch (err) {
    alert("Phantom connection rejected.");
  }
}

async function connectOKX() {
  try {
    const okx = window.okxwallet?.solana;
    if (!okx) return alert("OKX Wallet not installed.");
    const accounts = await okx.connect();
    walletAddress = accounts.publicKey.toString();
    provider = okx;
    updateWalletUI();
  } catch (err) {
    alert("OKX connection failed.");
  }
}

function disconnectWallet() {
  walletAddress = "";
  provider = null;
  document.getElementById("wallet-address").innerText = "Wallet: -";
  document.getElementById("invite-link").innerText = "-";
}

function copyLink() {
  const link = document.getElementById("invite-link").innerText;
  navigator.clipboard.writeText(link).then(() => {
    alert("Invite link copied!");
  });
}

async function mintEarn() {
  if (!walletAddress) return alert("Please connect wallet first.");
  alert("Mint request submitted! (Demo only)");
}

async function claimZero() {
  if (!walletAddress) return alert("Please connect wallet first.");
  alert("Zero-transfer claim success! (Demo only)");
}
