/**
 * @fileoverview Trading components exports
 * @module trading/components
 */

export { GenerationProgress, progressStyles } from './GenerationProgress.jsx';
export { GlassBoxDisplay, glassBoxStyles } from './GlassBoxDisplay.jsx';

/**
 * Combined styles for all trading components
 */
export const allStyles = `
/* Generation Progress Styles */
${progressStyles}

/* Glass Box Display Styles */
${glassBoxStyles}
`;
