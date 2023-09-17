/**
 * @param {string} fileUrl File URL usually comes from 'import.meta.url'
 * @returns {import('pino').Logger} Logger
 */
export function loggerFactory(fileUrl: string): import('pino').Logger;
export default loggerFactory;
