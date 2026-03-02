// 香水工坊 - 游戏逻辑

const IDLE_DURATION_MS = 5000; // 挂机 5 秒

class Game {
  constructor() {
    this.commonCount = {};   // 普通材料数量 { 材料名: number }
    this.specialCount = {};  // 特殊材料数量
    this.specialItemCount = {}; // 特殊道具数量 { itemId: number }
    this.unlockedPerfumes = new Set(); // 已解锁香水 id
    this.unlockedMaterials = new Set(); // 已获得过的材料（用于统计解锁种类数）
    this.triedCombinations = []; // 尝试过的组合 [{ common: Set, special: string|null }]
    this.obtainedSpecialItemIds = new Set(); // 已获得过的特殊道具 id（每种一次）
    this.selectedSpecialItemId = null; // 本次挂机携带的特殊道具
    this.isIdling = false;
    this.idleTimer = null;
    this.allPerfumes = getAllPerfumes();
    this.materialUnlockCount = 0; // 已解锁的材料种类数（用于里程碑）
  }

  getUnlockedMaterialCount() {
    return this.unlockedMaterials.size;
  }

  addMaterial(name, isSpecial, count = 1) {
    const wasNew = !this.unlockedMaterials.has(name);
    this.unlockedMaterials.add(name);
    if (isSpecial) {
      this.specialCount[name] = (this.specialCount[name] || 0) + count;
    } else {
      this.commonCount[name] = (this.commonCount[name] || 0) + count;
    }
    if (wasNew) {
      this.materialUnlockCount = this.unlockedMaterials.size;
      return this.checkSpecialItemMilestone();
    }
    return null;
  }

  checkSpecialItemMilestone() {
    if (!SPECIAL_ITEM_MILESTONES.includes(this.materialUnlockCount)) return null;
    const available = SPECIAL_ITEMS.filter(it => !this.obtainedSpecialItemIds.has(it.id));
    if (available.length === 0) return null;
    const chosen = available[Math.floor(Math.random() * available.length)];
    this.obtainedSpecialItemIds.add(chosen.id);
    this.specialItemCount[chosen.id] = (this.specialItemCount[chosen.id] || 0) + 1;
    return chosen;
  }

  selectSpecialItemForIdle(itemId) {
    if (!itemId || (this.specialItemCount[itemId] || 0) < 1) return false;
    this.selectedSpecialItemId = itemId;
    return true;
  }

  startIdle(onProgress, onFinish) {
    if (this.isIdling) return;
    this.isIdling = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= IDLE_DURATION_MS) {
        this.isIdling = false;
        this.finishIdle();
        onFinish && onFinish(this.lastIdleReward);
        return;
      }
      onProgress && onProgress(elapsed / IDLE_DURATION_MS);
      this.idleTimer = setTimeout(tick, 100);
    };
    tick();
  }

  finishIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    const n = 2 + Math.floor(Math.random() * 2); // 2 或 3
    const reward = { common: [], special: null, newSpecialItem: null };
    for (let i = 0; i < n; i++) {
      const m = COMMON_MATERIALS[Math.floor(Math.random() * COMMON_MATERIALS.length)];
      const newItem = this.addMaterial(m, false, 1);
      reward.common.push(m);
      if (newItem) reward.newSpecialItem = newItem;
    }
    if (this.selectedSpecialItemId) {
      const item = SPECIAL_ITEMS.find(it => it.id === this.selectedSpecialItemId);
      if (item && (this.specialItemCount[this.selectedSpecialItemId] || 0) >= 1) {
        this.specialItemCount[this.selectedSpecialItemId]--;
        const specialMat = SPECIAL_MATERIALS[item.materialId];
        const newItem = this.addMaterial(specialMat, true, 1);
        reward.special = specialMat;
        if (newItem) reward.newSpecialItem = newItem;
      }
      this.selectedSpecialItemId = null;
    }
    this.lastIdleReward = reward;
  }

  // 制作香水。attemptCommon: string[], attemptSpecial: string|null
  // 返回 { success, perfume, consumed } 成功且首次解锁时 consumed=true
  craft(attemptCommon, attemptSpecial) {
    if (!attemptCommon || attemptCommon.length === 0) return { success: false, perfume: null, consumed: false };
    if (attemptCommon.length > 3) return { success: false, perfume: null, consumed: false };
    if (attemptSpecial && !SPECIAL_MATERIALS.includes(attemptSpecial)) return { success: false, perfume: null, consumed: false };
    const trySet = new Set(attemptCommon);
    if (trySet.size !== attemptCommon.length) return { success: false, perfume: null, consumed: false }; // 重复材料
    this.triedCombinations.push({ common: new Set(attemptCommon), special: attemptSpecial || null });

    let matched = null;
    for (const p of this.allPerfumes) {
      if (formulaMatch(attemptCommon, attemptSpecial, p)) {
        matched = p;
        break;
      }
    }
    if (!matched) return { success: false, perfume: null, consumed: false };

    const alreadyUnlocked = this.unlockedPerfumes.has(matched.id);
    if (alreadyUnlocked) return { success: true, perfume: matched, consumed: false };

    // 检查材料是否足够并扣除
    const needCommon = [...matched.formula.common];
    const needSpecial = matched.formula.special || null;
    for (const m of needCommon) {
      if ((this.commonCount[m] || 0) < 1) return { success: false, perfume: matched, consumed: false, reason: 'insufficient' };
    }
    if (needSpecial && (this.specialCount[needSpecial] || 0) < 1) return { success: false, perfume: matched, consumed: false, reason: 'insufficient' };

    for (const m of needCommon) this.commonCount[m]--;
    if (needSpecial) this.specialCount[needSpecial]--;
    this.unlockedPerfumes.add(matched.id);
    return { success: true, perfume: matched, consumed: true };
  }

  // 获取某香水的公式显示：已通过尝试揭示的部分显示材料名，否则 ?
  getFormulaDisplay(perfume) {
    const required = [...perfume.formula.common];
    if (perfume.formula.special) required.push(perfume.formula.special);
    const revealed = new Set();
    for (const t of this.triedCombinations) {
      for (const r of required) {
        if (t.common.has(r) || t.special === r) revealed.add(r);
      }
    }
    return required.map(r => revealed.has(r) ? r : '?');
  }

  hasEnoughForFormula(perfume) {
    for (const m of perfume.formula.common) {
      if ((this.commonCount[m] || 0) < 1) return false;
    }
    if (perfume.formula.special && (this.specialCount[perfume.formula.special] || 0) < 1) return false;
    return true;
  }

  getCommonCount(name) { return this.commonCount[name] || 0; }
  getSpecialCount(name) { return this.specialCount[name] || 0; }
  getSpecialItemCount(itemId) { return this.specialItemCount[itemId] || 0; }
  isPerfumeUnlocked(id) { return this.unlockedPerfumes.has(id); }

  save() {
    return JSON.stringify({
      commonCount: this.commonCount,
      specialCount: this.specialCount,
      specialItemCount: this.specialItemCount,
      unlockedPerfumes: [...this.unlockedPerfumes],
      unlockedMaterials: [...this.unlockedMaterials],
      triedCombinations: this.triedCombinations.map(t => ({
        common: [...t.common],
        special: t.special
      })),
      obtainedSpecialItemIds: [...this.obtainedSpecialItemIds]
    });
  }

  load(jsonStr) {
    try {
      const o = JSON.parse(jsonStr);
      this.commonCount = o.commonCount || {};
      this.specialCount = o.specialCount || {};
      this.specialItemCount = o.specialItemCount || {};
      this.unlockedPerfumes = new Set(o.unlockedPerfumes || []);
      this.unlockedMaterials = new Set(o.unlockedMaterials || []);
      this.triedCombinations = (o.triedCombinations || []).map(t => ({
        common: new Set(t.common),
        special: t.special
      }));
      this.obtainedSpecialItemIds = new Set(o.obtainedSpecialItemIds || []);
      this.materialUnlockCount = this.unlockedMaterials.size;
    } catch (e) {}
  }
}
