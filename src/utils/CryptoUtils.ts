export function generateToken(length: number = 32): string {
    const values = crypto.getRandomValues(new Uint8Array(length));
    const token = Array.from(values, (byte) => String.fromCharCode(byte)).join("");
    return Buffer.from(token, "binary").toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}