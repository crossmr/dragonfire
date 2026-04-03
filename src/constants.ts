import { Sticker } from "./types";

export const CLASSES = [
  "Druid", "Wizard", "Fighter", "Rogue", "Cleric", "Paladin", "Ranger", "Warlock"
];

export const RACES = [
  "Fairy", "Dragonborn", "Human", "Elf", "Dwarf", "Halfling", "Half-Orc", "Gnome"
];

export const STICKERS: Sticker[] = [
  { 
    id: "1", 
    name: "RECOVERY", 
    requirement: "none",
    description: "When you defeat a non-token encounter that matches your primary Class Type, heal 1 HP.",
    featureType: "30 XP",
    lineNumber: "1"
  },
  { 
    id: "2", 
    name: "MONSTER HUNTER", 
    requirement: "none",
    description: "When a Monstrosity encounter is placed facing you, draw one card. That encounter gains +1 Attack Strength until it's defeated.",
    featureType: "35 XP",
    lineNumber: "2"
  },
];

export const TRACKER_LABELS = [
  "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "STUN", "UNC"
];
