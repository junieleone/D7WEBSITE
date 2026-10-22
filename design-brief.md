# NASA PACE Architectural Massing Tool: Build Prompt

Act as a computational designer, architect, and software developer. Build an interactive 3D architectural massing tool called “PACE Futures Lab.”

I am designing an office of the future for NASA’s PACE mission as an architectural studio proposal. I want to upload my own base masses and generate, compare, and refine building configurations on the supplied site image. The tool must produce editable 3D geometry through explicit rules for aggregation, orientation, displacement, rotation, scaling, connections, and collision.

1. PROJECT AND SITE

Use the attached aerial image of One Herald Plaza on Biscayne Bay, Miami. The intended studio site is the long waterfront parcel outlined in red, east of Herald Plaza. The image caption describes approximately 330 × 820 feet, or 100 × 250 meters, with its long axis north–south. Treat these as approximate project inputs, not surveyed dimensions.

Display the image beneath the model. Let me trace and edit the site boundary, calibrate scale using a known distance, adjust north, and mark entrances, service access, the water edge, setbacks, height limits, and areas to keep open. Preserve image proportions; flag discrepancies between the image and stated dimensions.

Keep the footprint and overhangs within the selected buildable boundary unless I explicitly enable an exception. Keep the bay and adjacent streets excluded from building placement by default. The caption describes a vacant lot while the photo shows an older structure: make existing structures optional context rather than automatically treating them as retained buildings. Show unspecified planning constraints as unset, not verified.

2. MY BASE MASSES

Support multiple imported OBJ, STL, and GLB masses, with simple demonstration shapes available before upload. Let me confirm units and orientation and identify separate modules. Preserve the geometry I supply, including recognizable curves and openings. Keep an unchanged source mesh and apply reversible transforms to each instance. If a format or geometry is unsupported, explain what conversion is needed.

For each mass, expose its name, program assignment, instance count, local axes, centroid or pivot, position, rotation, scale, and permitted connection locations. Use the volume centroid for valid closed solids; otherwise use a clearly identified fallback pivot. Let me reposition the pivot.

Use centroids for transformation control and selected faces or edges as connection anchors. Show these as separate overlays. Validate imported geometry and flag open, invalid, or self-intersecting meshes when they prevent reliable solid checks.

3. GEOMETRIC RULES

Provide sliders, numerical inputs, and direct manipulation for:

- X/Y displacement and Z elevation.
- Rotation about local or world axes, with angle limits and increments.
- Uniform scale, minimum and maximum size, and optional independent axis scaling.
- Mass repetition, spacing, stacking, and instance count.
- Locks for individual masses, transforms, and connections.

Default to upright masses with rotation around the vertical axis. Make tilting and shape-distorting scale explicit options. Allow rotation around a centroid, selected connector, or chosen edge.

Let me choose compatible face-to-face and edge-to-edge connectors. Each connector needs a position, orientation, connection type, and tolerance. On curved or irregular masses, allow manually defined connection frames or patches.

For face connections, align opposing face normals and maintain a user-defined minimum contact area. Permit sliding within the contact plane only while that requirement remains satisfied. For edge connections, expose alignment, minimum shared length, and hinge angle. Recheck connections after every transform.

Prevent unintended solid penetration while allowing intended surface contact within tolerance. Use bounding boxes only as an initial collision filter, followed by geometry-aware intersection and containment checks. Report any simplified collision proxy. Include an explicitly enabled experimental overlap mode, with affected masses visibly marked.

4. TURN AGGREGATES INTO BUILDING PROPOSALS

Maintain separate relationships for geometric contact, circulation, and conceptual support. Edge contact alone does not create a walkable route or demonstrate support.

Reserve space for entrances, corridors, stairs, elevators, service routes, and connecting bridges. Add these only through explicit rules, with their area and geometry counted. Require a conceptual circulation route from every occupied program mass to an entrance; vertical changes need a stair, elevator, or ramp allowance.

Flag floating masses, missing support relationships, excessive user-defined cantilevers, disconnected floors, and conflicts with reserved circulation. Distinguish geometric support indicators from structural engineering validation. Label results as massing studies, not code-approved or structurally certified designs.

5. NASA PACE PROGRAM AND OFFICE OF THE FUTURE

PACE studies ocean ecosystems, phytoplankton, aerosols, and clouds using satellite observations. Translate those research themes into a proposed building program. Treat the following as editable studio design choices, not an official NASA room schedule:

- Dry laboratories for satellite imagery, ocean-color research, AI, and geospatial analysis.
- Wet laboratories for water samples and phytoplankton research, with preparation and storage.
- A mission-control-style science operations and visualization room.
- Flexible offices, interdisciplinary project spaces, and quiet focus rooms.
- Conference rooms, hybrid collaboration rooms, and project review spaces.
- An immersive data visualization and simulation studio.
- Sensor prototyping and instrument-testing spaces.
- A public exhibition and education area.
- Staff amenities, shaded terraces, and shared social spaces.
- IT/server rooms, building services, storage, and loading.

The science operations room is a proposed facility for this project; do not describe it as relocating NASA’s existing PACE Mission Operations Center at Goddard.

Let me set target areas or proportions, quantities, privacy levels, daylight preferences, floor-height requirements, and adjacency priorities. Provide an editable program relationship matrix. Initial relationships should favor wet labs near preparation and service access, analysis labs near offices and visualization, and operations near analysis and IT. Separate public circulation from restricted research areas.

Express “office of the future” through adaptable spaces, collaboration, focused work, hybrid participation, wellbeing, and capacity for change. Let these priorities influence arrangements rather than relying only on a futuristic appearance.

6. GENERATION AND EVALUATION

Use a reproducible seeded, constraint-based search. Generate candidates through permitted transformations and connector matches, reject hard-constraint violations, then compare feasible alternatives using adjustable design priorities.

Let me choose the number of alternatives, with an initial target of 12. Offer families such as a courtyard, a linear research spine, terraced clusters, connected pavilions, and a compact vertical arrangement. All families must use my uploaded masses and respect the enabled rules.

Let me lock a preferred mass or cluster and regenerate the remainder. Deduplicate similar solutions and retain meaningful variety. Provide progress, cancellation, an attempt limit, and clear reasons when constraints prevent the requested number of valid alternatives.

Hard constraints include enabled boundaries, height limits, transform limits, required connections, and prohibited collisions. Soft priorities include program fit, circulation connectivity, bay-facing views, open space, compactness, and collaboration adjacency. Let me change priorities and rerank results.

Show each metric, its calculation method, and its tradeoffs. Report footprint, height, occupied levels, program areas, and circulation allowances. Estimate floor area from horizontal sections at specified floor elevations, accounting for voids and overlapping areas. Label estimates and never equate exterior surface area or bounding-box volume with usable floor area.

Use geometric exposure and obstruction measures only as clearly labeled daylight or view proxies. Add solar, wind, or flood analysis only when the necessary inputs and a stated method are available. Do not invent environmental scores or regulatory limits. If only geometric support is checked, show architectural feasibility as unresolved.

7. INTERFACE AND OUTPUTS

Provide a central 3D viewport, a mass/program panel, a rules panel, and an iteration gallery. Include top, perspective, and elevation views; orbit, zoom, undo/redo, reset, and selection.

Use distinct program colors and optional overlays for centroids, connectors, circulation, conflicts, site boundaries, and the waterfront. Selecting a warning should highlight the relevant geometry.

Let me compare alternatives using the same camera and scale, favorite designs, edit an alternative directly, and generate variations from it. Explain each arrangement in plain language, tying the description to its actual geometry and measured results.

Export selected geometry as OBJ or GLB, presentation images, and a metrics table. Save and reopen a project with its source geometry, site image, calibration, rules, program, random seed, and chosen iterations. Preserve object names, units, transforms, and program assignments for further modeling.

8. IMPLEMENTATION AND FIRST WORKING VERSION

Use a browser-based 3D interface with modular geometry, constraint, generation, and scoring components. Choose maintained tools suitable for this workflow. Use client-side processing where practical and keep the interface responsive during generation.

First deliver a working loop: import masses, calibrate the site, assign connectors, edit transforms, generate valid alternatives, inspect conflicts, save, and export. Use clearly labeled demonstration masses until I upload mine. Expand advanced environmental analysis and detailed room planning after that loop works.

Verify with meaningful examples: a face connection, an edge connection requiring a circulation allowance, penetration and fully contained overlap, an out-of-bound mass, a disconnected elevated mass, and a locked mass during regeneration. Confirm that the same inputs and seed reproduce the same result, and that project save/reopen preserves the design.

Clearly identify any deferred capability. Use editable, visibly labeled assumptions for missing inputs and ask questions only when they prevent a useful first version. Implement the application when I give you this prompt, and explain how to use it.

Reference sources for mission context:

- [NASA PACE mission overview](https://science.nasa.gov/mission/pace/)
- [NASA Goddard: PACE engineering and mission operations](https://etd.gsfc.nasa.gov/etd-featured-stories/advancing-ocean-and-atmospheric-science/)

The site boundary and approximate dimensions come from my supplied studio image; the architectural program and design rules are proposed project requirements.

