/**
 * Formats a value based on its type to be passed into Standard Input (stdin).
 * 
 * Supports:
 * - Arrays: `[1, 2, 3]` -> `1 2 3` or `1\n2\n3`
 * - Strings: `"hello"` -> `hello`
 * - Primitive variables
 */

export const formatInputType = (value, type) => {
    if (!value) return '';
    try {
        const trimmed = value.trim();

        switch (type) {
            case 'array_space':
                // Attempt to parse [1, 2] and join with spaces
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const arr = JSON.parse(trimmed);
                    return arr.join(' ');
                }
                return value; // Fallback

            case 'array_newline':
                // Attempt to parse [1, 2] and join with newlines
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const arr = JSON.parse(trimmed);
                    return arr.join('\n');
                }
                return value;

            case 'string':
                // Remove outer quotes if user types "hello"
                if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                    (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                    return trimmed.slice(1, -1);
                }
                return value;

            // For primitive integers, floats, and raw blobs, return as-is
            default:
                return value;
        }
    } catch (e) {
        // If JSON.parse fails, return the raw value
        console.warn('Failed to parse input:', e);
        return value;
    }
}
