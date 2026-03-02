// 香水工坊 - 游戏数据

// 11种普通材料
const COMMON_MATERIALS = [
  '玫瑰', '茉莉', '薰衣草', '橙花', '鸢尾', '香草', '琥珀', '麝香', '雪松', '广藿香', '佛手柑'
];

// 5种特殊材料
const SPECIAL_MATERIALS = [
  '龙涎香', '沉香', '苏合香', '乳香', '没药'
];

// 5种特殊道具（与特殊材料一一对应，挂机时携带可获得对应特殊材料）
const SPECIAL_ITEMS = [
  { id: 'item_1', name: '龙涎香精', materialId: 0 },
  { id: 'item_2', name: '沉香木', materialId: 1 },
  { id: 'item_3', name: '苏合香脂', materialId: 2 },
  { id: 'item_4', name: '乳香树脂', materialId: 3 },
  { id: 'item_5', name: '没药膏', materialId: 4 }
];

// 材料解锁里程碑：解锁第 2、5、8、12、15 种材料时获得随机特殊道具（每种一次）
const SPECIAL_ITEM_MILESTONES = [2, 5, 8, 12, 15];

// 普通香水：15种，公式为 1~3 种普通材料 + 0 或 1 种特殊材料
// 每种香水的 formula: { common: [材料名...], special: 材料名|null }
const COMMON_PERFUMES = [
  { id: 'cp1', name: '晨曦花园', formula: { common: ['玫瑰', '茉莉'], special: null } },
  { id: 'cp2', name: '午后阳光', formula: { common: ['橙花', '佛手柑'], special: null } },
  { id: 'cp3', name: '静谧之夜', formula: { common: ['薰衣草', '麝香'], special: null } },
  { id: 'cp4', name: '森林漫步', formula: { common: ['雪松', '广藿香'], special: null } },
  { id: 'cp5', name: '甜蜜梦境', formula: { common: ['香草', '鸢尾'], special: null } },
  { id: 'cp6', name: '琥珀之忆', formula: { common: ['琥珀', '玫瑰'], special: null } },
  { id: 'cp7', name: '三重奏', formula: { common: ['玫瑰', '茉莉', '薰衣草'], special: null } },
  { id: 'cp8', name: '东方韵', formula: { common: ['麝香', '琥珀'], special: '龙涎香' } },
  { id: 'cp9', name: '禅意', formula: { common: ['雪松', '鸢尾'], special: '沉香' } },
  { id: 'cp10', name: '古寺余香', formula: { common: ['广藿香', '佛手柑'], special: '苏合香' } },
  { id: 'cp11', name: '焚香', formula: { common: ['雪松'], special: '乳香' } },
  { id: 'cp12', name: '神圣之烟', formula: { common: ['香草', '琥珀'], special: '乳香' } },
  { id: 'cp13', name: '治愈', formula: { common: ['薰衣草', '香草'], special: '没药' } },
  { id: 'cp14', name: '皇家花园', formula: { common: ['玫瑰', '鸢尾', '琥珀'], special: null } },
  { id: 'cp15', name: '海岸清风', formula: { common: ['佛手柑', '雪松', '薰衣草'], special: null } }
];

// 5种特殊香水
const SPECIAL_PERFUMES = [
  { id: 'sp1', name: '龙涎梦境', formula: { common: ['琥珀', '麝香'], special: '龙涎香' } },
  { id: 'sp2', name: '沉香古调', formula: { common: ['广藿香', '雪松'], special: '沉香' } },
  { id: 'sp3', name: '苏合秘境', formula: { common: ['鸢尾', '香草'], special: '苏合香' } },
  { id: 'sp4', name: '乳香圣殿', formula: { common: ['玫瑰', '薰衣草'], special: '乳香' } },
  { id: 'sp5', name: '没药秘语', formula: { common: ['琥珀', '香草'], special: '没药' } }
];

function getAllMaterials() {
  return [...COMMON_MATERIALS, ...SPECIAL_MATERIALS];
}

function getAllPerfumes() {
  return [...COMMON_PERFUMES, ...SPECIAL_PERFUMES];
}

// 将香水公式转为“组合集合”（不看顺序）
function formulaToSet(p) {
  const s = new Set(p.formula.common);
  if (p.formula.special) s.add(p.formula.special);
  return s;
}

// 检查两个公式组合是否相等（集合相等）
function formulaMatch(attemptCommon, attemptSpecial, perfume) {
  const needCommon = new Set(perfume.formula.common);
  const needSpecial = perfume.formula.special;
  const tryCommon = new Set(attemptCommon);
  const trySpecial = attemptSpecial || null;
  if (needCommon.size !== tryCommon.size) return false;
  if ([...needCommon].some(m => !tryCommon.has(m))) return false;
  if ((needSpecial || null) !== (trySpecial || null)) return false;
  return true;
}
