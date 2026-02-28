# Prompts – The Last of the Snacks

This folder holds **prompt templates** for common tasks. Copy a template, adjust the placeholders, and paste into Cursor to start a task.

## Example templates (to add as needed)

- **New lobby setting**  
  “Add a new lobby setting [NAME] that the host can toggle. Sync it via set_lobby_settings and include it in room_updated and joined. Add a toggle in the lobby UI and store it in gameStore.lobbySettings. Add i18n keys for en and es.”

- **New card type**  
  “Add a new card type [TYPE] to the game. Update shared types and the game engine, add validation and handler on the server, and show it in the How to Play page. Add i18n for the card name and description.”

- **New WebSocket event**  
  “The server will send a new event [EVENT] with payload [PAYLOAD]. Add handling in useGameSocket and update gameStore (add a setter and state field if needed). Document the event in ai/docs/MESSAGE_PROTOCOL.md.”

- **i18n**  
  “Add Spanish (and English if missing) translations for the following strings used in [COMPONENT/PAGE]: [LIST]. Use the existing namespace [X] and key pattern [Y].”

Store templates as `.md` or `.txt` files; keep them short and parameterized so you can fill in the bracketed parts.
