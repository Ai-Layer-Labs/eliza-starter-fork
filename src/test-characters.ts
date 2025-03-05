// test-characters.ts
// Import the characters to test loading
import { elizaCharacter } from "../characters/eliza.character.ts";
import { metatronCharacter } from "../characters/metatron.character.ts";

console.log("Eliza name:", elizaCharacter.name);
console.log("Metatron name:", metatronCharacter.name);
console.log("Characters array:", [elizaCharacter, metatronCharacter]); 