import { useAuth } from '../contexts/AuthContext'
import {
  canView as checkCanView,
  canCreate as checkCanCreate,
  canEdit as checkCanEdit,
  canDelete as checkCanDelete,
  hasFullAccess as checkFullAccess,
  getPermissionLevel,
  isRoleHigherOrEqual,
} from '../config/permissions'

export function useAuthorization() {
  const { role } = useAuth()

  const canAccess = (module, action = 'view') => {
    if (!role) return false
    switch (action) {
      case 'view': return checkCanView(role, module)
      case 'create': return checkCanCreate(role, module)
      case 'edit': return checkCanEdit(role, module)
      case 'delete': return checkCanDelete(role, module)
      default: return checkCanView(role, module)
    }
  }

  const can = (module, action = 'view') => canAccess(module, action)

  const hasFullAccess = (module) => {
    if (!role) return false
    return checkFullAccess(role, module)
  }

  const getLevel = (module) => {
    if (!role) return 'none'
    return getPermissionLevel(role, module)
  }

  const isAtLeast = (targetRole) => {
    if (!role) return false
    return isRoleHigherOrEqual(role, targetRole)
  }

  return { can, canAccess, hasFullAccess, getLevel, isAtLeast, role }
}
