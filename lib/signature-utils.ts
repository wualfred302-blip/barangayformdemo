export async function generateSignatureHash(signature: string): Promise<string> {
  if (!signature) return "";
  
  try {
    // Convert base64 signature to ArrayBuffer
    const binaryString = atob(signature.split(',')[1] || signature); // Handle data URI or raw base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Hash the signature
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error("Error generating signature hash:", error);
    return "";
  }
}

export async function verifySignatureHash(signature: string, hash: string): Promise<boolean> {
  if (!signature || !hash) return false;
  
  const generatedHash = await generateSignatureHash(signature);
  return generatedHash === hash;
}
