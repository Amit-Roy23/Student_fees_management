import { formatDate, formatDateTime } from "./utils";

export { formatDate, formatDateTime };

export function paiseToRupees(paise: number | bigint | null | undefined): number {
  if (paise === null || paise === undefined) return 0;
  return Number(paise) / 100;
}

export function rupeesToPaise(rupees: number | string | null | undefined): number {
  if (rupees === null || rupees === undefined || rupees === "") return 0;
  const num = typeof rupees === "string" ? parseFloat(rupees.replace(/,/g, "")) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Format paise into Indian Currency format, e.g. 12500000 paise -> "₹1,25,000"
 */
export function formatINR(paise: number | bigint | null | undefined, showDecimals: boolean = false): string {
  if (paise === null || paise === undefined) return "₹0";
  const rupees = paiseToRupees(paise);
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Converts a rupee amount into Indian English Words
 * e.g. 125000 -> "One Lakh Twenty-Five Thousand Rupees Only"
 */
export function amountInWordsINR(paise: number | bigint): string {
  const rupees = Math.floor(paiseToRupees(paise));
  if (rupees === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertSection(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + ones[n % 10] : "") + " ";
    } else if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  let num = rupees;
  let words = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    words += convertSection(crore) + " Crore ";
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    words += convertSection(lakh) + " Lakh ";
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    words += convertSection(thousand) + " Thousand ";
  }

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  if (hundred > 0) {
    words += ones[hundred] + " Hundred ";
  }

  if (remainder > 0) {
    if (words !== "") words += "and ";
    words += convertSection(remainder) + " ";
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

/**
 * Format Indian Phone number e.g. +91 98765 43210
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
