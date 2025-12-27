export interface PaymentTransaction {
  id: string;
  transactionReference: string;
  paymentMethod: "gcash" | "maya" | "bank_transfer";
  amount: number;
  status: "pending" | "success" | "failed";
  certificateId: string;
  qrtIdId?: string;
  createdAt: string;
  completedAt?: string;
}

export const processPayment = (
  method: "gcash" | "maya" | "bank_transfer",
  amount: number,
  certId: string
): Promise<PaymentTransaction> => {
  return new Promise((resolve, reject) => {
    // Random delay between 2000-3000ms
    const delay = Math.floor(Math.random() * 1000) + 2000;

    setTimeout(() => {
      // 95% success rate
      const isSuccess = Math.random() < 0.95;
      
      if (isSuccess) {
        const transaction: PaymentTransaction = {
          id: Math.random().toString(36).substring(2, 9),
          transactionReference: `${method.toUpperCase()}-${Date.now()}`,
          paymentMethod: method,
          amount,
          status: "success",
          certificateId: certId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        resolve(transaction);
      } else {
        reject(new Error("Payment processing failed. Please try again."));
      }
    }, delay);
  });
};

export const generateReceiptPDF = (transaction: PaymentTransaction) => {
  // In a real app, this would generate a PDF blob
  // For this demo, we'll rely on the browser's print functionality
  // which will be triggered by the UI component
  
  // We can format the data for the clipboard as a fallback
  const receiptText = `
BARANGAY MAWAQUE
OFFICIAL RECEIPT

Reference: ${transaction.transactionReference}
Date: ${new Date(transaction.completedAt || transaction.createdAt).toLocaleString()}
Method: ${transaction.paymentMethod.toUpperCase()}
Amount: ₱${transaction.amount.toFixed(2)}
Certificate ID: ${transaction.certificateId}
Status: ${transaction.status.toUpperCase()}
  `.trim();
  
  return receiptText;
};

export const validatePaymentMethod = (
  method: "gcash" | "maya" | "bank_transfer",
  formData: any
): { isValid: boolean; error?: string } => {
  if (method === "gcash") {
    const { mobile, pin } = formData;
    if (!mobile || !/^09\d{9}$/.test(mobile)) {
      return { isValid: false, error: "Please enter a valid GCash mobile number (09XXXXXXXXX)" };
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      return { isValid: false, error: "Please enter a valid 4-digit PIN" };
    }
  } else if (method === "maya") {
    const { mobile, pin } = formData;
    if (!mobile || !/^09\d{9}$/.test(mobile)) {
      return { isValid: false, error: "Please enter a valid Maya mobile number (09XXXXXXXXX)" };
    }
    if (!pin || !/^\d{6}$/.test(pin)) {
      return { isValid: false, error: "Please enter a valid 6-digit PIN" };
    }
  } else if (method === "bank_transfer") {
    const { referenceNumber } = formData;
    if (!referenceNumber || referenceNumber.length < 6) {
      return { isValid: false, error: "Please enter a valid transaction reference number" };
    }
  }
  
  return { isValid: true };
};
