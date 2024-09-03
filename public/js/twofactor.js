async function twoFactor() {
  const modalElement = document.getElementById("twoFactorModal");

  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);

    if (!window.isAuthenticated) {
      modal.show();
    }

    const qrCodeContainer = document.getElementById("qr-code-container");
    const tokenInput = document.getElementById("token");
    const verifyButton = document.getElementById("verify-2fa");

    const fetchQRCode = async () => {
      try {
        const response = await fetch("/setup-2fa");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (qrCodeContainer) {
            qrCodeContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code">`;
          }
        } else {
          throw new Error("Expected JSON but received something else.");
        }
      } catch (error) {
        console.error("Error fetching QR code:", error.message);
      }
    };

    fetchQRCode();

    const handleVerify2FA = async () => {
      const token = tokenInput.value;

      try {
        const response = await fetch("/verify-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (data.success) {
          window.location.reload();
        } else {
          alert("Invalid token");
        }
      } catch (error) {
        alert("Error verifying token: " + error.message);
      }
    };

    if (verifyButton) {
      verifyButton.addEventListener("click", handleVerify2FA);
    }
  }
}

export { twoFactor };
