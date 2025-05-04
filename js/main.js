
let provider, program, wallet;
let referrer = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

(async function detectRef() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (ref) localStorage.setItem("ref", ref);
  referrer = localStorage.getItem("ref");
})();

function updateInviteLink() {
  try {
    const pubkey = wallet?.toBase58?.() || wallet?.toString?.() || wallet;
    if (pubkey) {
      const link = window.location.origin + "?ref=" + pubkey;
      document.getElementById("invite-link").innerText = link;
      console.log("✅ Invite link updated:", link);
    } else {
      throw new Error("Wallet not ready");
    }
  } catch (e) {
    console.warn("⚠️ Failed to update invite link:", e);
  }
}

function copyLink() {
  const text = document.getElementById("invite-link").innerText;
  if (!text || text === "-") return alert("Invite link not ready.");
  navigator.clipboard.writeText(text).then(() => {
    alert("Link copied!");
  });
}

async function getProgram() {
  const idl = await fetch("https://earndapp.netlify.app/idl.json").then(res => res.json());
  const programId = new solanaWeb3.PublicKey(idl.metadata.address);
  const anchorProvider = new anchor.AnchorProvider(connection, provider, {});
  return new anchor.Program(idl, programId, anchorProvider);
}

async function connectPhantom() {
  provider = window.solana;
  if (!provider || !provider.isPhantom) {
    alert("Please install Phantom");
    return;
  }
  const resp = await provider.connect();
  wallet = new solanaWeb3.PublicKey(resp.publicKey.toString());
  await afterConnect();
}

async function connectOKX() {
  provider = window.okxwallet?.solana;
  if (!provider) {
    alert("Please install OKX Wallet");
    return;
  }
  const resp = await provider.connect();
  wallet = new solanaWeb3.PublicKey(resp.publicKey.toString());
  await afterConnect();
}

function disconnectWallet() {
  if (provider && provider.disconnect) provider.disconnect();
  wallet = null;
  document.getElementById("wallet-address").innerText = "Not connected";
  document.getElementById("invite-link").innerText = "-";
}

async function afterConnect() {
  if (!wallet) {
    console.error("❌ Wallet public key missing.");
    return alert("Wallet connection failed.");
  }

  document.getElementById("wallet-address").innerText = wallet.toString();
  program = await getProgram();
  updateInviteLink();
  fetchBalance();
}

async function claimZero() {
  if (!wallet) return alert("Connect wallet first");
  try {
    const tx = await program.methods.claimZero().accounts({
      user: wallet,
      systemProgram: solanaWeb3.SystemProgram.programId,
    }).rpc();
    alert("✅ Claimed successfully: " + tx);
    fetchBalance();
  } catch (e) {
    console.error(e);
    alert("❌ Already claimed or error");
  }
}

async function mintEarn() {
  if (!wallet) return alert("Connect wallet first");
  const input = document.getElementById("mint-amount").value;
  const amount = parseFloat(input);
  if (isNaN(amount) || amount < 0.1) return alert("Minimum 0.1 SOL");

  try {
    const tx = await program.methods
      .mintWithReferral(new anchor.BN(amount * 1e9), referrer ? new solanaWeb3.PublicKey(referrer) : null)
      .accounts({
        user: wallet,
        systemProgram: solanaWeb3.SystemProgram.programId,
      })
      .rpc();
    alert("✅ Minted: " + tx);
    fetchBalance();
  } catch (e) {
    console.error(e);
    alert("❌ Mint failed");
  }
}

async function fetchBalance() {
  try {
    const userToken = await program.account.userToken.fetch(wallet);
    document.getElementById("token-balance").innerText = userToken.amount.toString();
  } catch (e) {
    document.getElementById("token-balance").innerText = "0";
  }
}
