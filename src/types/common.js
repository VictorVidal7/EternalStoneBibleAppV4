/**
 * @typedef {Object} Verse
 * @property {string} book - The name of the book
 * @property {number} chapter - The chapter number
 * @property {number} number - The verse number
 * @property {string} text - The text of the verse
 */

/**
 * @typedef {Object} Bookmark
 * @property {string} book - The name of the book
 * @property {number} chapter - The chapter number
 * @property {number} verse - The verse number
 */

/**
 * @typedef {Object} ReadingPlan
 * @property {string} id - Unique identifier for the plan
 * @property {string} name - Name of the reading plan
 * @property {string} description - Description of the reading plan
 * @property {number} duration - Duration of the plan in days
 * @property {Array<{day: number, passages: string[]}>} readings - Daily readings
 */

// You can add more type definitions as needed