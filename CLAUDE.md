# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Prema is a dating app built with React Native + Expo (SDK 54, RN 0.81, React 19). The backend lives in a sibling repo at `../backend` (FastAPI; run with `uvicorn main:app --reload`). The deployed API is at `https://prema-dating-app.onrender.com` (see `config.ts`).

Bundle id: `com.vsandilya.mobileapp` · EAS project id: `950daeae-2962-4bf0-9c65-90eb6b1bac9e`.

## Commands

```bash
npm start          # expo start (Metro)
npm run ios        # expo start --ios
npm run android    # expo start --android
npm run web        # expo start --web
npm run lint       # expo lint (eslint-config-expo)

eas build --profile development   # dev client build
eas build --profile preview       # internal distribution
eas build --profile production    # store build (autoIncrement, appVersionSource: remote)
eas update --branch <channel>     # ship a JS-only OTA update
```

There is no test runner configured.

**Runtime version gotcha**: `runtimeVersion.policy` is `"appVersion"`, which means OTA updates (`eas update`) only reach clients running the **same** `expo.version` from `app.json`. Bumping `expo.version` cuts a new runtime, and existing installs will not pick up the change via OTA — they require a fresh `eas build` and store/TestFlight distribution. Reserve version bumps for native/config changes; keep JS-only changes on the current version.

## Architecture

### Navigation: React Navigation, NOT expo-router

Despite `expo-router` being a dependency and an `app/` directory existing, the live navigation tree is built with `@react-navigation/stack` in `App.tsx`. The `app/` folder and most files in `components/` (themed-text, themed-view, parallax-scroll-view, hello-wave, `components/ui/*`, `external-link.tsx`) are leftover Expo-template scaffolding and are not wired into the running app. Real screens live in `screens/` and are registered in `App.tsx`.

`App.tsx` switches between `AuthStack` (Login/Register/Terms/Forgot/Reset) and `AppStack` (Browse/Profile/EditProfile/Conversations/Chat/Matches/Likes/ProfileView/About/FullScreenPhoto) based on `useAuth().user`. The route name `Browse` resolves to `SlotMachineScreen` — keep this alias when adding navigation calls. A `navigationRef` (`utils/navigation.ts`) is used to reset/navigate from outside React (e.g. on 401, on notification taps).

### `AuthContext` is the API layer

`contexts/AuthContext.tsx` is not just auth — it owns the single `axios` instance and exposes every backend call as a method on the context: `login/register/logout`, `updateUser/refreshUser/updateUserPhotos`, messaging (`sendMessage`, `getConversations`, `getMessagesWithUser`, `markMessageAsRead`), discovery (`browseUsers`, `likeUser`, `passUser`, `getUsersWhoLikedMe`, `getMatches`, `unmatchUser`), `spin`/`getSpinStatus`, reporting/blocking, and `deleteAccount`. Add new endpoints here rather than building parallel API clients in screens.

Token handling: JWT stored in `AsyncStorage` under `authToken`, applied as `api.defaults.headers.common['Authorization']`. A response interceptor catches `401`, clears auth state, alerts the user, and resets navigation to `Login` via `resetToAuth()`. The `api` axios instance is exported from this file — import it directly only when you need a request that the context doesn't expose.

### Slot-machine spin flow (don't break this)

`SlotMachineScreen` enforces "spin → like/pass → spin" by persisting the pending profile in `AsyncStorage` under a **user-specific key** `pendingProfile_${user.id}` (with legacy migration from a plain `pendingProfile` key). Critical invariants:

- `logout()` deliberately does NOT clear `pendingProfile_*` keys — when the user logs back in, they must Pass/Like the held profile before spinning, so a spin isn't "wasted."
- A safety check clears the pending profile if its `id` matches the logged-in user (self-match guard).
- `useFocusEffect` reloads the pending profile on every focus; an effect on `user.id` clears local state on user switch.

### Push notifications

`utils/notifications.ts` requests permissions, fetches an Expo push token (project id is hardcoded — keep in sync with `app.json`), and POSTs it to `/users/push-token` as multipart. Registration is fire-and-forget after login and on app start (in `AuthContext` `initAuth`). Tap handling lives in `App.tsx`'s `AppNavigator` effect and routes by `data.type` / `data.screen` (`match` → Matches, `message` → Conversations + optional Chat with `user_id`/`user_name`, `like` → Browse).

### Other conventions

- **Photo URLs**: backend may return relative paths (`/uploads/...`). Screens use a `getImageUrl` helper that prefixes `API_BASE_URL` when the path starts with `/uploads/` or `uploads/`. Reuse this pattern instead of assuming absolute URLs.
- **Display name**: always render through `getDisplayName()` (`utils/formatting.ts`) — it falls back to `"Prema User"` when name is empty. This is App Store Guideline 5.1.1 compliance (name is optional at signup); don't bypass it.
- **Distance**: `formatDistance()` converts km → miles with a "Less than a mile away" floor; the UI is mile-based even though the API returns km.
- **Asset paths**: bundled images live under `./assets/images/`, not `./assets/` directly. `app.json` references `./assets/images/prema-logo-2.png` for `icon`, and `./assets/images/android-icon-{foreground,background,monochrome}.png` for the Android adaptive icon. New images go in `assets/images/` to match.
- **Location updates**: `hooks/useLocationAutoUpdate.ts` throttles GPS-based profile updates to once per 10 minutes via the `lastLocationUpdate` AsyncStorage key.
- **Login**: backend expects OAuth2-password-flow style — username/password as `multipart/form-data` to `/auth/login`. Don't switch to JSON.
- **External services**: backend is hosted on Render (`https://prema-dating-app.onrender.com`); user photos are stored in AWS S3 (the API returns S3 URLs, or `/uploads/...` paths the app rewrites against `API_BASE_URL`); transactional email (password reset, etc.) is sent via AWS SES from the backend.
- **TypeScript**: `strict: true`, path alias `@/*` → repo root. New Architecture is enabled (`newArchEnabled: true`) and `reactCompiler` experiment is on.

## Reference docs in repo

- `README.md` — feature/setup overview (note: it predates the slot-machine flow and lists `API_BASE_URL` as living in `AuthContext.tsx`; it actually lives in `config.ts`).
- `MESSAGING_UI.md` — chat/conversations screen behavior, including the 3-second polling cadence in `ChatScreen`.
