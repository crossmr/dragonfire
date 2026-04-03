export interface Sticker {
  id: string;
  name: string;
  requirement?: string;
  description: string;
  featureType?: string;
  lineNumber?: string;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  stickers: Record<number, string | null>; // slot index (1-6) to sticker name
  trackerValue: number; // 0 to 15 (14 numbers + STUN + UNC)
  magicItems: string;
  magicItemsRight: string;
  xp: string;
  level: string;
}

export interface Campaign {
  id: string;
  name: string;
  characters: Character[];
  lastModified: number;
}
