/**
 * Central place for the list of valid employee teams.
 * To add a new team, add one entry here — dropdown, badge, and
 * filter in the Employees section all read from this array.
 */
export const TEAMS = [
  { value: 'PC', label: 'PC', badgeClass: 'badge-info' },
  { value: 'IMS', label: 'IMS', badgeClass: 'badge-warning' },
  { value: 'BOTH', label: 'BOTH', badgeClass: 'badge-success' },
];

export const DEFAULT_TEAM = 'PC';

export function getTeamConfig(value) {
  return TEAMS.find((t) => t.value === value) || TEAMS[0];
}

/**
 * True if the user should see employees from every team —
 * either they're flagged as Admin, or their own team is 'BOTH'.
 */
export function canSeeAllTeams(user) {
  return !!user && (user.team === 'BOTH' || user.role === 'Admin');
}
