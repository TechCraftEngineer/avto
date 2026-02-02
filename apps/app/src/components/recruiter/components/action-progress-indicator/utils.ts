export function formatActionType(actionType: string): string {
  // Simple formatting - can be extended based on action types
  return (
    actionType.charAt(0).toUpperCase() +
    actionType.slice(1).toLowerCase().replace(/_/g, " ")
  );
}
