/**
 * 权限 Hook
 */

import { hasPermission, hasAnyPermission } from "../utils/auth";

export function usePermission() {
	return {
		hasPermission,
		hasAnyPermission,
	};
}
