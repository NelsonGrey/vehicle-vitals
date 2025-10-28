Deletes & data notes

- The web UI now exposes a "Delete Vehicle" action which removes the vehicle document at `users/{userId}/vehicles/{vin}`.
- This delete is a single-document delete and does NOT cascade to maintenance subcollections. If you need cascading deletes (remove maintenance entries), implement a Cloud Function, recursive delete utility, or manually delete the nested documents before deleting the vehicle.

Next steps / improvements

- Implement recursive delete for vehicle removal if you want to remove all subcollection docs automatically.
- Add undo/snackbar for deletes to improve UX.
- Add pagination or real-time listeners for the vehicle list for larger datasets.
