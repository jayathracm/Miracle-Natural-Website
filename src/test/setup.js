// Runs before every test file. Adds the jest-dom matchers (toBeInTheDocument,
// toHaveTextContent, etc.) to Vitest's expect, for the component tests that
// opt into jsdom.
import '@testing-library/jest-dom/vitest';
