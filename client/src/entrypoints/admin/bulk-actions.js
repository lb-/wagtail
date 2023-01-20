import {
  addBulkActionListeners,
  rebindBulkActionsEventListeners,
} from '../../includes/bulk-actions';

document.addEventListener('DOMContentLoaded', addBulkActionListeners);
document.addEventListener('w-search:success', rebindBulkActionsEventListeners);
