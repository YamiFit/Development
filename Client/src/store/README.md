# Redux Store Structure

This directory contains the centralized state management using Redux Toolkit with Redux Persist.

## Structure

```
store/
├── index.js              # Store configuration with Redux Persist
├── selectors.js          # Memoized selectors for performance
├── exports.js            # Central export point
├── slices/
│   ├── authSlice.js     # Authentication state
│   ├── settingsSlice.js # User settings state
│   └── uiSlice.js       # UI state (modals, sidebar, etc.)
└── utils/
    ├── actionCreators.js # Reusable action patterns
    └── helpers.js        # Redux utility functions
```

## Usage

### Import Store
```javascript
import { store, persistor } from '@/store';
```

### Use Selectors
```javascript
import { useSelector } from 'react-redux';
import { selectUser, selectProfile } from '@/store/selectors';

const user = useSelector(selectUser);
const profile = useSelector(selectProfile);
```

### Dispatch Actions
```javascript
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '@/store/slices/authSlice';

const dispatch = useDispatch();
dispatch(setAuth({ user, session, profile }));
```

### Use Redux Hooks
```javascript
import { useAuthRedux as useAuth } from '@/hooks/useAuthRedux';

const { user, profile, signIn, signOut } = useAuth();
```

## Persistence

Redux Persist is configured to:
- **Persist:** auth, settings
- **Exclude:** loading states, errors, UI state
- **Storage:** localStorage
- **Key:** `persist:yamifit`

## Development

Use Redux DevTools extension for debugging:
- Time-travel debugging
- Action history
- State inspection

## Clean Code Principles

1. **DRY:** Reusable action creators and utilities
2. **Single Responsibility:** Each slice handles one domain
3. **Immutability:** Redux Toolkit uses Immer internally
4. **Performance:** Memoized selectors with createSelector
5. **Type Safety:** Clear action and state structures

## Best Practices

1. Always use selectors instead of accessing state directly
2. Use memoized selectors for computed values
3. Keep reducers pure (no side effects)
4. Use Redux DevTools in development
5. Batch related dispatches when possible
6. Use optimistic updates for better UX

## Documentation

See `REDUX_REFACTORING_GUIDE.md` for complete documentation.
