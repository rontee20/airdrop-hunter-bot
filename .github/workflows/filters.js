export function isValidProject(project) {

  if (!project.name) return false;
  if (!project.website) return false;
  if (!project.twitter) return false;

  // skip listed tokens
  if (project.token === true) return false;

  // must have useful tasks
  const validTasks = [
    "follow",
    "discord",
    "bridge",
    "swap",
    "stake",
    "galxe",
    "testnet"
  ];

  if (!validTasks.some(task => project.tasks?.join(" ").toLowerCase().includes(task))) {
    return false;
  }

  return true;
}
