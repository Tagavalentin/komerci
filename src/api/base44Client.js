// Point d'entrée historique : le SDK Base44 est remplacé par le client local
// (src/api/client.js) adossé au serveur Express + MySQL.
export { base44, getAccessToken, setAccessToken, ApiError } from './client';
