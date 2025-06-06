/**
 * Common interface for all map elements (locations and regions).
 * This interface defines the shared properties that any element placed on the map must have.
 * 
 * Locations and regions extend this interface to add their specific properties:
 * - Locations: single point position and location type
 * - Regions: multiple points position, region type, and border visibility
 */
import { MdCastle, MdOutlineCastle, MdPlace } from "react-icons/md";
import { LuCastle, LuSwords, LuWaves, LuShipWheel } from "react-icons/lu";
import { GiCastle, GiCastleRuins, GiElvenCastle, GiMedievalBarracks, GiMedievalGate, GiMedievalPavilion, GiVillage, GiHutsVillage, GiDungeonGate, GiDwarfFace, GiDwarfHelmet, GiCrenelCrown, GiCrownOfThorns, GiCrownedSkull, GiOpenTreasureChest, GiDervishSwords, GiMagicLamp, GiMagicAxe, GiMagicGate, GiStoneTower, GiWhiteTower, GiWhiteBook, GiMonsterGrasp, GiWaterDrop, GiTombstone } from "react-icons/gi";
import { BiSolidCastle, BiSolidCrown } from "react-icons/bi";
import { TbBuildingCastle } from "react-icons/tb";
import { PiCastleTurret, PiCastleTurretBold, PiCastleTurretDuotone, PiCastleTurretFill, PiCastleTurretLight, PiCastleTurretThin, PiTreasureChestFill } from "react-icons/pi";
import { FaDungeon, FaCrown, FaMountain, FaPlaceOfWorship, FaCircle, FaBookOpen, FaScroll, FaUniversity } from "react-icons/fa";
import { FaDungeon as Fa6Dungeon, FaCrown as Fa6Crown, FaMountain as Fa6Mountain, FaPlaceOfWorship as Fa6PlaceOfWorship, FaSailboat, FaDroplet } from "react-icons/fa6";
import { LiaDungeonSolid } from "react-icons/lia";
import { RiVipCrown2Fill, RiVipCrown2Line, RiGoblet2Fill } from "react-icons/ri";
import { SiMagic, SiFireship } from "react-icons/si";
import { GrStatusPlaceholderSmall } from "react-icons/gr";

export const ELEMENT_ICONS = {
  MdCastle: { label: "Castle", icon: MdCastle },
  MdOutlineCastle: { label: "Outline Castle", icon: MdOutlineCastle },
  LuCastle: { label: "Lu Castle", icon: LuCastle },
  GiCastle: { label: "Classic Castle", icon: GiCastle },
  GiCastleRuins: { label: "Castle Ruins", icon: GiCastleRuins },
  GiElvenCastle: { label: "Elven Castle", icon: GiElvenCastle },
  BiSolidCastle: { label: "Solid Castle", icon: BiSolidCastle },
  TbBuildingCastle: { label: "Building Castle", icon: TbBuildingCastle },
  PiCastleTurret: { label: "Castle Turret", icon: PiCastleTurret },
  PiCastleTurretBold: { label: "Castle Turret Bold", icon: PiCastleTurretBold },
  PiCastleTurretDuotone: { label: "Castle Turret Duotone", icon: PiCastleTurretDuotone },
  PiCastleTurretFill: { label: "Castle Turret Fill", icon: PiCastleTurretFill },
  PiCastleTurretLight: { label: "Castle Turret Light", icon: PiCastleTurretLight },
  PiCastleTurretThin: { label: "Castle Turret Thin", icon: PiCastleTurretThin },
  GiMedievalBarracks: { label: "Medieval Barracks", icon: GiMedievalBarracks },
  GiMedievalGate: { label: "Medieval Gate", icon: GiMedievalGate },
  GiMedievalPavilion: { label: "Medieval Pavilion", icon: GiMedievalPavilion },
  GiVillage: { label: "Village", icon: GiVillage },
  GiHutsVillage: { label: "Huts Village", icon: GiHutsVillage },
  FaDungeon: { label: "Dungeon", icon: FaDungeon },
  Fa6Dungeon: { label: "Dungeon (Alt)", icon: Fa6Dungeon },
  GiDungeonGate: { label: "Dungeon Gate", icon: GiDungeonGate },
  LiaDungeonSolid: { label: "Dungeon Solid", icon: LiaDungeonSolid },
  GiDwarfFace: { label: "Dwarf Face", icon: GiDwarfFace },
  GiDwarfHelmet: { label: "Dwarf Helmet", icon: GiDwarfHelmet },
  FaCrown: { label: "Crown", icon: FaCrown },
  Fa6Crown: { label: "Crown (Alt)", icon: Fa6Crown },
  LuCrown: { label: "Lu Crown", icon: LuCastle },
  GiCrenelCrown: { label: "Crenel Crown", icon: GiCrenelCrown },
  GiCrownOfThorns: { label: "Crown of Thorns", icon: GiCrownOfThorns },
  GiCrownedSkull: { label: "Crowned Skull", icon: GiCrownedSkull },
  RiVipCrown2Fill: { label: "VIP Crown Fill", icon: RiVipCrown2Fill },
  RiVipCrown2Line: { label: "VIP Crown Line", icon: RiVipCrown2Line },
  BiSolidCrown: { label: "Solid Crown", icon: BiSolidCrown },
  GiOpenTreasureChest: { label: "Treasure Chest", icon: GiOpenTreasureChest },
  LuSwords: { label: "Swords", icon: LuSwords },
  GiDervishSwords: { label: "Dervish Swords", icon: GiDervishSwords },
  PiTreasureChestFill: { label: "Treasure Chest Fill", icon: PiTreasureChestFill },
  FaMountain: { label: "Mountain", icon: FaMountain },
  Fa6Mountain: { label: "Mountain (Alt)", icon: Fa6Mountain },
  LuWaves: { label: "Waves", icon: LuWaves },
  FaPlaceOfWorship: { label: "Place of Worship", icon: FaPlaceOfWorship },
  Fa6PlaceOfWorship: { label: "Place of Worship (Alt)", icon: Fa6PlaceOfWorship },
  MdPlace: { label: "Place", icon: MdPlace },
  GrStatusPlaceholderSmall: { label: "Placeholder", icon: GrStatusPlaceholderSmall },
  FaCircle: { label: "Circle", icon: FaCircle },
  GiMagicLamp: { label: "Magic Lamp", icon: GiMagicLamp },
  GiMagicAxe: { label: "Magic Axe", icon: GiMagicAxe },
  GiMagicGate: { label: "Magic Gate", icon: GiMagicGate },
  SiMagic: { label: "Magic", icon: SiMagic },
  RiGoblet2Fill: { label: "Goblet", icon: RiGoblet2Fill },
  GiStoneTower: { label: "Stone Tower", icon: GiStoneTower },
  GiWhiteTower: { label: "White Tower", icon: GiWhiteTower },
  FaBookOpen: { label: "Book Open", icon: FaBookOpen },
  GiWhiteBook: { label: "White Book", icon: GiWhiteBook },
  FaScroll: { label: "Scroll", icon: FaScroll },
  GiMonsterGrasp: { label: "Monster Grasp", icon: GiMonsterGrasp },
  LuShipWheel: { label: "Ship Wheel", icon: LuShipWheel },
  SiFireship: { label: "Fireship", icon: SiFireship },
  FaSailboat: { label: "Sailboat", icon: FaSailboat },
  FaDroplet: { label: "Droplet", icon: FaDroplet },
  GiWaterDrop: { label: "Water Drop", icon: GiWaterDrop },
  FaUniversity: { label: "University", icon: FaUniversity },
  GiTombstone: { label: "Tombstone", icon: GiTombstone },
} as const;

export type ElementIcon = keyof typeof ELEMENT_ICONS;

export interface MapElement {
  id: string;
  name?: string;
  label?: string;
  showLabel?: boolean; // Whether to show the label above the icon
  description?: string;
  image?: string;
  color: string;
  prominence: number;
  icon: ElementIcon; // User-selected icon key
  type: string; // The type of the element (e.g. 'City', 'Kingdom', etc.)
  position: [number, number] | [number, number][]; // Single point for locations, array of points for regions
  fields: { [key: string]: string }; // Dictionary of custom field names and values, always initialized as empty
} 