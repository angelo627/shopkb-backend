export const activityDescription = {
  productCreated(name: string) {
    return `Created product "${name}".`;
  },

  productUpdated(name: string) {
    return `Updated product "${name}".`;
  },

  productDeleted(name: string) {
    return `Deleted product "${name}".`;
  },

  stockIn(name: string, quantity: number) {
    return `Added ${quantity} units to "${name}".`;
  },

  stockOut(name: string, quantity: number) {
    return `Removed ${quantity} units from "${name}".`;
  },

  productDeactivated(name: string) {
    return `Deactivated product "${name}".`;
  },

  productActivated(name: string) {
    return `Activated product "${name}".`;
  },
};