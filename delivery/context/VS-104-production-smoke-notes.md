# VS-104 production smoke implementation notes

The implementation intentionally lives in `scripts/start-api.mjs`, which is already in VS-104 allowed paths and already owns bounded one-shot production actions. No new runtime service, endpoint, public route, credential, OAuth scope, publishing capability or scheduler is introduced.
