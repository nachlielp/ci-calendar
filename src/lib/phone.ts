// Phone numbers as legacy's forms took them.

/**
 * What a phone input keeps of what was typed or pasted: digits, and a plus
 * only at the start (legacy `handlePhoneNumberInput`, which dropped other
 * keys as they were pressed).
 */
export function phoneInput(text: string): string {
    const plus = text.trimStart().startsWith("+")
    return (plus ? "+" : "") + text.replace(/\D/g, "")
}

/**
 * An Israeli mobile number, as the role request form required (legacy
 * RequestForm): `05x` and seven digits, or the same after `+972`/`972`
 * without the leading zero.
 */
export const isIsraeliMobile = (phone: string) =>
    /^(?:\+972|972|0)5[0-9][0-9]{7}$/.test(phone)
