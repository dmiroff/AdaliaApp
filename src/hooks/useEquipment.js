// src/hooks/useEquipment.js
import { useContext, useCallback } from "react";
import { Context } from "../index";

export const useEquipment = () => {
  const { user } = useContext(Context);

  const isItemEquipped = useCallback((itemId) => {
    if (!user.player || !itemId) return false;
    
    const equipmentSlots = [
      "head", "right_hand", "left_hand", "breast_armor", "cloak", 
      "ring_1", "ring_2", "ring_3", "ring_4", "ring_5", 
      "gloves", "necklace", "leg_armor", "boots", "secondary_weapon", 
      "belt", "arm_armor"
    ];
    
    return equipmentSlots.some(slot => {
      const slotItem = user.player[slot];
      return slotItem && slotItem.id === itemId;
    });
  }, [user.player]);

  const getEquippedItems = useCallback(() => {
    if (!user.player) return new Set();
    
    const equipmentSlots = [
      "head", "right_hand", "left_hand", "breast_armor", "cloak", 
      "ring_1", "ring_2", "ring_3", "ring_4", "ring_5", 
      "gloves", "necklace", "leg_armor", "boots", "secondary_weapon", 
      "belt", "arm_armor"
    ];
    
    const equippedIds = new Set();
    equipmentSlots.forEach(slot => {
      const slotItem = user.player[slot];
      if (slotItem && slotItem.id) {
        equippedIds.add(slotItem.id);
      }
    });
    
    return equippedIds;
  }, [user.player]);

  return {
    isItemEquipped,
    getEquippedItems
  };
};