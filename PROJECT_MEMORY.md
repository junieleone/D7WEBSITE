# PACE Futures Lab project rules

## 2026-10-21 correction: overlaps and underground masses

- Intentional intersections between masses must be supported. Default to allowing mass overlaps, with an explicit switch to reject them.
- Generate alternatives must preserve the edited arrangement as the first alternative and cut off geometry below the ground plane. Do not substitute a vertical translation for this cut.
- Cap closed cut contours; preserve courtyard openings. Apply cuts to geometry used in views, analysis, project saves, OBJ and GLB exports.
- Keep the original source masses and previous alternatives. Locks retain transforms but do not exempt masses from an enabled ground cut.
- Fully buried masses have no above-ground remainder and are removed from the corrected alternative. Report this clearly.
- Overlapping masses remain separate objects. Shared floor area is counted per mass and must be disclosed; an overlap alone is not a verified circulation path.

## 2026-10-22 corrections: similar variations and saved projects

- Default generation must derive every variation from the active edited composition, including duplicates, removals, rotations, scales, program assignments, and ground cuts. A preserved source card followed by unrelated family layouts does not satisfy this request.
- Preserve locked transforms and existing overlapping pairs. Offer a variation amount and a browsable latest-batch gallery with the source alongside its descendants. Fresh family layouts require an explicit mode choice.
- Save project must store a named, reopenable snapshot in a visible Saved projects tab, including alternatives and favorites. Offer direct access to favorites and portable JSON backups. Clearly state that this implementation uses browser-local storage rather than cross-device sync.

## 2026-10-22 · Organization diversity
- User found nearby perturbations too similar. Default to mixed, named organization studies derived from the current placed instances, not source-library reconstruction.
- Keep subtle refinement as a separate mode. Organization studies retain edited shapes/proportions/programs and locks but may change overlap relationships.
- Reject near-duplicate studies using transform distance. Keep the source composition beside results and label each organization in the existing gallery.
- Verified all five strategies, source preservation, duplicates, locks and existing ground/refinement tests. Browser QA unavailable this session (preview connection refusal followed by browser URL-policy rejection).
