class_name ShophouseStreet
extends RefCounted

const BAY_WIDTH := 8.0
const BAY_DEPTH := 18.0
const FRONT_Z := 5.0
const BACK_Z := FRONT_Z - BAY_DEPTH
const GROUND_CEILING := 4.6
const UPPER_TOP := 8.6
const CENTERS := [-12.0, -4.0, 4.0, 12.0]
## Real shophouses cantilever their upper storey out to the pillar/awning
## line, well forward of the recessed ground-floor shopfront, rather than
## sitting flush with it -- per direct reference photos. Matches where the
## pillars themselves stand, so they read as visually supporting this
## overhanging edge.
const UPPER_FACADE_Z := FRONT_Z + 3.0
const PILLAR_HALF_WIDTH := 0.24
## A genuinely condensed face (not Syne squashed via scale.x, which was
## faking it) -- Bebas Neue Regular is also inherently heavy-set, so no
## separate bold cut is needed for the signs to read as condensed bold.
const SIGN_FONT: Font = preload("res://assets/fonts/BebasNeue-Regular.ttf")
const BEARY_LOGO: Texture2D = preload("res://assets/bearys/bearys_logo.svg")
const BEARY_OPEN_SIGN: Texture2D = preload("res://assets/bearys/open_come_in.svg")
const KARAOKE_LOGO_FONT: Font = preload("res://assets/kaixin/Anton-Regular.ttf")

const FACADE_COLORS: Array[Color] = [
	Color("d8b7d0"), Color("b9d9ce"), Color("efc487"), Color("f4ddbd")
]
const ROOM_COLORS: Array[Color] = [
	Color("211827"), Color("ffffff"), Color("f2ddc1"), Color("f4ddbd")
]
# Unglazed clay roof tile, per direct reference photos -- fired terracotta
# reds and browns, not a tint derived from each bay's own pastel facade.
# One shade per bay for the same weathered, not-quite-uniform read the
# reference row of rooftops has.
const ROOF_TILE_COLORS: Array[Color] = [
	Color("b6512c"), Color("a8461f"), Color("c1663a"), Color("9c4522")
]
const ROOF_RIDGE_COLOR := Color("6b2f16")

static func build(parent: Node3D) -> Dictionary:
	var root := Node3D.new()
	root.name = "KuehStreetShophouses"
	parent.add_child(root)
	_build_walkway(root)
	for index in range(CENTERS.size()):
		_build_bay(root, index, float(CENTERS[index]))
	_build_pillar_plants(root)
	_build_arcade_interior(root)
	_build_gallery_interior(root)
	_build_restaurant_interior(root)
	return {
		"root": root,
		"amanda_door": _anchor(root, "AmandasClosedDoorInteraction", Vector3(12.0, 0, FRONT_Z + 0.75)),
	}

## Real-world span (meters) one tile texture repeat covers -- small enough
## to read as individual mosaic tiles rather than one stretched decal.
const FIVE_FOOT_WAY_TILE_SIZE := 0.5
## Each run's footprint, rounded up from the walkway's natural 16.4 x 3.3 m
## span to the nearest whole multiple of FIVE_FOOT_WAY_TILE_SIZE (33 x 7
## tiles). The UV anchor below already starts each run cleanly on a tile
## boundary at its front-left corner; a non-whole-tile footprint still left
## the far (right/bottom) edge ending mid-tile, cutting the pattern off
## there. Growing the slab by a few centimeters -- imperceptible for a floor
## decal -- is preferable to shrinking tile size down to 0.1 m (16.4 and 3.3
## share no larger common divisor), which would read as a dense carpet
## instead of individual pavers.
const FIVE_FOOT_WAY_WIDTH := 16.5
const FIVE_FOOT_WAY_DEPTH := 3.5

static func _build_walkway(root: Node3D) -> void:
	# A custom quad with explicit world-unit UVs instead of _part()'s
	# SuperEgg shape (equirectangular UVs, badly warped under a tiling
	# texture) or a plain BoxMesh (its per-face UV is 0..1 regardless of the
	# face's real aspect ratio, so a uv1_scale tuned per axis still doesn't
	# guarantee a SQUARE physical tile -- direct u=x/tile_size, v=z/tile_size
	# UVs remove that ambiguity entirely). A 4 cm threshold reads as a
	# pavement edge but no longer demands a jump.
	# Two continuous two-shop runs, each using a different motif and palette
	# from Ken's backdoor tile generator. Their edges meet exactly at x=0.
	var half_width := FIVE_FOOT_WAY_WIDTH * 0.5
	var left_floor := _build_tiled_floor(FIVE_FOOT_WAY_WIDTH, FIVE_FOOT_WAY_DEPTH, FIVE_FOOT_WAY_TILE_SIZE, TilePattern.generate_tile(TilePattern.TILE_PALETTES[0], 0))
	left_floor.name = "LeftTwoShopFiveFootWay"
	left_floor.position = Vector3(-half_width, 0.04, FRONT_Z + 1.55)
	root.add_child(left_floor)
	# Corner-drop composition (see TilePattern.generate_corner_drop_tile):
	# each tile only draws its own quarter of a rosette at its four corners,
	# so the full motif only reconstructs across a 2x2 block of adjacent
	# tiles once repeated -- a different generated option from the same
	# engine, not just a recolor of the centered-medallion tile.
	var right_floor := _build_tiled_floor(FIVE_FOOT_WAY_WIDTH, FIVE_FOOT_WAY_DEPTH, FIVE_FOOT_WAY_TILE_SIZE, TilePattern.generate_corner_drop_tile(TilePattern.TILE_PALETTES[1]))
	right_floor.name = "RightTwoShopFiveFootWay"
	right_floor.position = Vector3(half_width, 0.04, FRONT_Z + 1.55)
	root.add_child(right_floor)
	_collision(root, Vector3(FIVE_FOOT_WAY_WIDTH * 2.0, 0.04, FIVE_FOOT_WAY_DEPTH), Vector3(0, 0.02, FRONT_Z + 1.55), "FiveFootWayFloor")
	# No separate soffit slab here anymore -- each bay's own SolidUpperStorey
	# now extends forward to the pillar line and serves as the walkway's
	# ceiling directly (see _build_upper_facade), so a second overlapping
	# slab at the same height would only z-fight against it.
	# Pillars moved into _build_bay() (see _build_bay_pillars) so each one
	# can carry its own bay's facade color, per direct instruction, instead
	# of every pillar being a single shared shade.

## A flat horizontal quad (centered on the parent's own origin) with UVs set
## directly in world units (u=x/tile_size, v=z/tile_size), so each texture
## repeat covers an exactly square tile_size x tile_size patch of ground
## regardless of the quad's own width/depth ratio.
static func _build_tiled_floor(width: float, depth: float, tile_size: float, texture: Texture2D) -> MeshInstance3D:
	var half_w := width * 0.5
	var half_d := depth * 0.5
	var corners := [
		Vector3(-half_w, 0.0, -half_d), Vector3(half_w, 0.0, -half_d),
		Vector3(half_w, 0.0, half_d), Vector3(-half_w, 0.0, half_d),
	]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_normal(Vector3.UP)
	for i in [0, 1, 2, 0, 2, 3]:
		var c: Vector3 = corners[i]
		# Anchor UV zero to this run's own front-left corner. Using centered
		# coordinates made a 16.4 m run begin 0.8 of a repeat into the motif
		# (see FIVE_FOOT_WAY_WIDTH/_DEPTH's own comment for the follow-up fix
		# once even this anchored version still cut off the far edges).
		st.set_uv(Vector2(c.x + half_w, c.z + half_d) / tile_size)
		st.add_vertex(c)
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.mesh = st.commit()
	var material := StandardMaterial3D.new()
	material.albedo_texture = texture
	material.roughness = 0.62
	mesh_instance.material_override = material
	return mesh_instance

## A few (not every) pillars get a potted plant beside them, per direct
## instruction -- reuses the same variant plants built for the restaurant
## interior. Positioned just inward of the pillar's own line (toward the
## building) so it stays within the tiled floor's own footprint rather than
## sitting past its edge, and away from the seams where two bays' pillars
## meet so it doesn't crowd them.
static func _build_pillar_plants(root: Node3D) -> void:
	var spots := [
		{"position": Vector3(-15.05, 0, UPPER_FACADE_Z - 0.18), "variant": 0},
		{"position": Vector3(7.05, 0, UPPER_FACADE_Z - 0.18), "variant": 1},
		{"position": Vector3(15.05, 0, UPPER_FACADE_Z - 0.18), "variant": 2},
	]
	for spot in spots:
		_build_potted_plant(root, spot["position"], spot["variant"])

## One pillar at each of a bay's own left/right edges, in that bay's own
## facade color -- positioned so its outer face sits exactly on the
## property line, meeting the neighboring bay's own pillar there rather
## than overlapping or leaving a gap.
## Runs 20cm past GROUND_CEILING into the SolidUpperStorey mass above, per
## direct correction -- flush-topped pillars were leaving a visible gap
## against the facade instead of reading as continuous with it.
const PILLAR_TOP_EXTEND := 0.20

static func _build_bay_pillars(bay: Node3D, center_x: float, color: Color) -> void:
	var pillar_height := GROUND_CEILING + PILLAR_TOP_EXTEND
	for side in [-1.0, 1.0]:
		var pillar_x: float = center_x + side * (BAY_WIDTH * 0.5 - PILLAR_HALF_WIDTH)
		_part(bay, Vector3(PILLAR_HALF_WIDTH, pillar_height * 0.5, PILLAR_HALF_WIDTH), color, Vector3(pillar_x, pillar_height * 0.5, UPPER_FACADE_Z), "FiveFootWayColumn")
		_collision(bay, Vector3(PILLAR_HALF_WIDTH * 2.0, pillar_height, PILLAR_HALF_WIDTH * 2.0), Vector3(pillar_x, pillar_height * 0.5, UPPER_FACADE_Z), "WalkwayColumnSolid")

## Same (x,z) positions _build_bay_pillars() places its columns at, exposed
## so a roaming NPC can avoid walking through one (see hub_roaming_npc.gd's
## own _can_move_to()) via a plain 2D distance check against this short list
## instead of a live physics query every frame -- the player already
## collides with these properly (they're real StaticBody3D colliders), this
## is only for NPCs, which move by setting global_position directly with no
## physics involved at all.
static func pillar_positions() -> Array[Vector2]:
	var positions: Array[Vector2] = []
	for center_x in CENTERS:
		for side in [-1.0, 1.0]:
			var pillar_x: float = center_x + side * (BAY_WIDTH * 0.5 - PILLAR_HALF_WIDTH)
			positions.append(Vector2(pillar_x, UPPER_FACADE_Z))
	return positions

static func _build_bay(root: Node3D, index: int, center_x: float) -> void:
	var facade_color := FACADE_COLORS[index]
	var room_color := ROOM_COLORS[index]
	var bay_back_z := -4.0 if index == 1 else BACK_Z
	var ground_depth := FRONT_Z - bay_back_z
	var ground_center_z := (FRONT_Z + bay_back_z) * 0.5
	var bay := Node3D.new()
	bay.name = ["KuehArcadeShophouse", "WhiteGalleryShophouse", "KuehRestaurantShophouse", "BearysCafeShophouse"][index]
	root.add_child(bay)

	# Ground floor: deep side walls, back wall, floor and high ceiling. The cafe
	# is deliberately a solid volume; the other three retain generous openings.
	# The finish lies essentially flush with the shared physics floor, fixing the
	# earlier visible ankle/foot burial without introducing a second collision.
	_part(bay, Vector3(BAY_WIDTH * 0.5 - 0.12, 0.004, ground_depth * 0.5), room_color, Vector3(center_x, 0.004, ground_center_z), "GroundFloorSurface")
	for side in [-1.0, 1.0]:
		# Each neighboring bay owns an interior wall skin on its own side of the
		# property line. The previous skins occupied the exact same plane, causing
		# the white gallery surface to z-fight through the arcade and restaurant.
		var wall_x: float = center_x + side * (BAY_WIDTH * 0.5 - 0.10)
		_part(bay, Vector3(0.10, GROUND_CEILING * 0.5, ground_depth * 0.5), room_color, Vector3(wall_x, GROUND_CEILING * 0.5, ground_center_z), "PartyWall")
		_collision(bay, Vector3(0.20, GROUND_CEILING, ground_depth), Vector3(wall_x, GROUND_CEILING * 0.5, ground_center_z), "PartyWallSolid")
	_part(bay, Vector3(BAY_WIDTH * 0.5, GROUND_CEILING * 0.5, 0.10), room_color, Vector3(center_x, GROUND_CEILING * 0.5, bay_back_z), "RearWall")
	_collision(bay, Vector3(BAY_WIDTH, GROUND_CEILING, 0.20), Vector3(center_x, GROUND_CEILING * 0.5, bay_back_z), "RearWallSolid")
	_part(bay, Vector3(BAY_WIDTH * 0.5, 0.10, ground_depth * 0.5), room_color, Vector3(center_x, GROUND_CEILING, ground_center_z), "GroundFloorCeiling")
	_build_shopfront(bay, index, center_x, facade_color)
	_build_bay_pillars(bay, center_x, facade_color)

	if index == 1:
		# The gallery intentionally stops halfway; its unused rear half becomes a
		# solid continuation of the mint shophouse rather than an empty void.
		_part(bay, Vector3(BAY_WIDTH * 0.5 - 0.20, GROUND_CEILING * 0.5, 4.45), facade_color, Vector3(center_x, GROUND_CEILING * 0.5, -8.5), "GalleryRearSolidBlock")
		_collision(bay, Vector3(BAY_WIDTH - 0.40, GROUND_CEILING, 8.9), Vector3(center_x, GROUND_CEILING * 0.5, -8.5), "GalleryRearSolidCollision")
		_build_gallery_paintings(bay, center_x, bay_back_z)
	elif index == 3:
		# Fill the entire inaccessible cafe bay. This sits directly behind the
		# decorative frontage, eliminating every sightline through panel seams.
		_part(bay, Vector3(BAY_WIDTH * 0.5 - 0.12, GROUND_CEILING * 0.5, BAY_DEPTH * 0.5 - 0.12), Color("f4ddbd"), Vector3(center_x, GROUND_CEILING * 0.5, (FRONT_Z + BACK_Z) * 0.5), "SolidBearysGroundStorey")
		_collision(bay, Vector3(BAY_WIDTH - 0.24, GROUND_CEILING, BAY_DEPTH - 0.24), Vector3(center_x, GROUND_CEILING * 0.5, (FRONT_Z + BACK_Z) * 0.5), "SolidBearysGroundCollision")

	_build_upper_facade(bay, index, center_x, facade_color)

static func _build_shopfront(bay: Node3D, index: int, center_x: float, color: Color) -> void:
	# Every ground floor now has the same legible shophouse frontage: two
	# decorated side panels and a central door opening. Beary's alone fills that
	# opening with a closed door and collision.
	for side in [-1.0, 1.0]:
		var panel_x: float = center_x + side * 2.62
		_part(bay, Vector3(1.38, GROUND_CEILING * 0.5, 0.30), color, Vector3(panel_x, GROUND_CEILING * 0.5, FRONT_Z), "GroundShopfrontPanel")
		_collision(bay, Vector3(2.76, GROUND_CEILING, 0.60), Vector3(panel_x, GROUND_CEILING * 0.5, FRONT_Z), "GroundShopfrontPanelSolid")
		var window_color := Color("f9e7cd") if index == 3 else (Color("fff7ec") if index != 0 else Color("4c3452"))
		_part(bay, Vector3(0.82, 0.90, 0.08), window_color, Vector3(panel_x, 2.25, FRONT_Z + 0.34), "ShopfrontWindow")
		if index == 3:
			_part(bay, Vector3(0.94, 1.02, 0.045), Color("c8793b"), Vector3(panel_x, 2.25, FRONT_Z + 0.30), "BearyWindowCaramelFrame")
			_part(bay, Vector3(0.82, 0.90, 0.055), Color("f9e7cd"), Vector3(panel_x, 2.25, FRONT_Z + 0.37), "BearyWindowCreamInset")
		for ornament_y in [0.72, 3.62]:
			_part(bay, Vector3(0.18, 0.18, 0.07), Color("fff1e3"), Vector3(panel_x, ornament_y, FRONT_Z + 0.43), "ShopfrontRosette")
	if index == 3:
		_part(bay, Vector3(1.18, 1.55, 0.14), Color("6b4423"), Vector3(center_x, 1.55, FRONT_Z + 0.20), "ClosedCafeDoor")
		_collision(bay, Vector3(2.36, 3.10, 0.32), Vector3(center_x, 1.55, FRONT_Z + 0.20), "ClosedCafeDoorCollision")
		# Round brass hardware and a small hanging open plaque make the closed
		# storefront door read as intentional and welcoming.
		_part(bay, Vector3(0.16, 0.22, 0.055), Color("5b351d"), Vector3(center_x + 0.72, 1.30, FRONT_Z + 0.42), "CafeDoorKnobPlate", 0.20, 0.34)
		_part(bay, Vector3(0.12, 0.12, 0.10), Color("d6a24c"), Vector3(center_x + 0.72, 1.30, FRONT_Z + 0.53), "CafeDoorKnob", 0.68, 0.22)
		_part(bay, Vector3(0.09, 0.09, 0.06), Color("d6a24c"), Vector3(center_x, 2.93, FRONT_Z + 0.48), "OpenSignDoorHook", 0.52, 0.24)
		for rope_side in [-1.0, 1.0]:
			var rope := _part(bay, Vector3(0.025, 0.41, 0.025), Color("b88754"), Vector3(center_x + rope_side * 0.25, 2.63, FRONT_Z + 0.50), "OpenSignRope")
			rope.rotation.z = rope_side * deg_to_rad(38.0)
		_part(bay, Vector3(0.72, 0.38, 0.07), Color("242424"), Vector3(center_x, 2.18, FRONT_Z + 0.50), "HangingOpenSign")
		var open_art := Sprite3D.new()
		open_art.name = "BearysOpenComeInArtwork"
		open_art.texture = BEARY_OPEN_SIGN
		open_art.pixel_size = 0.0024
		open_art.position = Vector3(center_x, 2.18, FRONT_Z + 0.60)
		open_art.shaded = false
		open_art.double_sided = true
		bay.add_child(open_art)
		# Amanda's cream/brown/pink/green language and round decorative dots come
		# directly from the current Beary project tokens.
		for dot_index in range(5):
			var dot_color: Color = [Color("e8998d"), Color("8fae7d"), Color("e8b96a")][dot_index % 3]
			_part(bay, Vector3(0.12, 0.12, 0.06), dot_color, Vector3(center_x - 0.72 + float(dot_index) * 0.36, 3.48, FRONT_Z + 0.42), "BearyShopfrontDot")
		_part(bay, Vector3(3.55, 0.08, 0.10), Color("c8793b"), Vector3(center_x, 3.72, FRONT_Z + 0.42), "BearyCaramelHeaderTrim")
		for leaf_side in [-1.0, 1.0]:
			for leaf_index in range(3):
				var leaf := _part(bay, Vector3(0.12, 0.24, 0.06), Color("8fae7d"), Vector3(center_x + leaf_side * (2.55 + float(leaf_index) * 0.25), 3.38 - float(leaf_index) * 0.17, FRONT_Z + 0.46), "BearyLeafMotif")
				leaf.rotation.z = leaf_side * deg_to_rad(34.0)
	_build_door_signboard(bay, index, center_x)

static func _build_door_signboard(bay: Node3D, index: int, center_x: float) -> void:
	# White Gallery and Eating House get a white board background; Beary's
	# keeps its own cream, and the Kueh Arcade keeps its facade-tinted board.
	var board_color: Color = Color("f9e7cd") if index == 3 else (Color("ffffff") if index in [1, 2] else FACADE_COLORS[index].darkened(0.18))
	# Only the Kueh Arcade keeps the bright glowing text; the other two
	# signed venues (Beary's own text is unused -- it renders an SVG logo
	# instead) use a dark font color per direct instruction.
	var text_color: Color = Color("6b4423") if index == 3 else (Color("fff8ef") if index == 0 else Color("2c2019"))
	var board_width := 1.25 if index == 3 else 1.52
	var board_height := 0.58 if index == 3 else 0.42
	_part(bay, Vector3(board_width, board_height, 0.12), board_color, Vector3(center_x, 3.72, FRONT_Z + 0.48), "VenueDoorSignboard")
	_part(bay, Vector3(board_width + 0.10, board_height + 0.07, 0.055), Color("a9764f") if index == 3 else FACADE_COLORS[index].darkened(0.34), Vector3(center_x, 3.72, FRONT_Z + 0.43), "VenueSignboardFrame")
	_part(bay, Vector3(board_width, board_height, 0.065), board_color, Vector3(center_x, 3.72, FRONT_Z + 0.51), "VenueSignboardFace")
	var title: String = ["KUEH ARCADE", "WHITE GALLERY", "EATING HOUSE", ""][index]
	# Labels sit clearly beyond the signboard's outermost face; the previous
	# nearly-coplanar placement allowed the board mesh to occlude the glyphs.
	if index == 3:
		var logo := Sprite3D.new()
		logo.name = "BearysSvgShopLogo"
		logo.texture = BEARY_LOGO
		logo.pixel_size = 0.005
		logo.position = Vector3(center_x, 3.72, FRONT_Z + 0.70)
		# Uniform XY scale preserves the supplied 322:159 SVG aspect ratio.
		logo.scale = Vector3(1.35, 1.35, 1.0)
		logo.shaded = false
		logo.double_sided = true
		bay.add_child(logo)
	else:
		# Only the Kueh Arcade sign actually glows -- the other two rely on
		# the same physical ceiling lamp Beary's already had.
		# 50% larger now that SIGN_FONT is a genuinely condensed face -- the
		# old size was tuned for Syne squashed via scale.x, which read
		# noticeably smaller.
		_sign(bay, title, Vector3(center_x, 3.72, FRONT_Z + 0.70), text_color, 0.0072, index == 0)
	if index != 0:
		# The same warm storefront lamp for every non-arcade venue, per direct
		# instruction -- keeps the sign readable beneath the deep five-foot-way
		# roof without each venue inventing its own fixture.
		_flush_ceiling_lamp(bay, center_x, FRONT_Z + 0.85, Color("a9764f"), Color("ffd8a3"), 1.15, 3.4)

## GroundFloorCeiling is a slab CENTERED on GROUND_CEILING with its own
## 0.10 half-thickness, so its real underside sits at GROUND_CEILING - 0.10,
## not at GROUND_CEILING itself -- the previous fixture was positioned
## against the slab's center plane, burying half of it inside the ceiling.
const CEILING_UNDERSIDE_Y := GROUND_CEILING - 0.10

## A flat fixture mounted flush to the ceiling's real underside rather than a
## shade sitting on a stem tall enough to poke up through it -- per direct
## correction, the whole shape now hangs entirely below the ceiling it is
## attached to instead of clipping into it. Shared by every non-arcade venue
## lamp and the karaoke stage's overhead lighting, which had the same
## clipping problem.
static func _flush_ceiling_lamp(parent: Node3D, x: float, z: float, fixture_color: Color, light_color: Color, light_energy: float, light_range: float) -> void:
	_part(parent, Vector3(0.34, 0.045, 0.24), fixture_color, Vector3(x, CEILING_UNDERSIDE_Y - 0.045, z), "CeilingLampFixture", 0.30, 0.32)
	var light := OmniLight3D.new()
	light.name = "CeilingLampLight"
	light.position = Vector3(x, CEILING_UNDERSIDE_Y - 0.20, z)
	light.light_color = light_color
	light.light_energy = light_energy
	light.omni_range = light_range
	parent.add_child(light)

## One framed painting on each of the gallery's three interior walls (back,
## left, right), per direct instruction -- a gallery with bare walls didn't
## read as one.
## Eye level for a standing figure -- matches HubPlayer's own camera height
## convention (total_height * 0.87) for a typical ~1.78m figure.
const PAINTING_EYE_LEVEL_Y := 1.55

static func _build_gallery_paintings(bay: Node3D, center_x: float, bay_back_z: float) -> void:
	var left_wall_x := center_x - (BAY_WIDTH * 0.5 - 0.10)
	var right_wall_x := center_x + (BAY_WIDTH * 0.5 - 0.10)
	var mid_z := (FRONT_Z + bay_back_z) * 0.5
	_gallery_painting(bay, Vector3(center_x, PAINTING_EYE_LEVEL_Y, bay_back_z), Color("c1666b"), false, 1.0)
	_gallery_painting(bay, Vector3(left_wall_x, PAINTING_EYE_LEVEL_Y, mid_z), Color("5b8a9a"), true, 1.0)
	_gallery_painting(bay, Vector3(right_wall_x, PAINTING_EYE_LEVEL_Y, mid_z), Color("d9a441"), true, -1.0)

## A plain solid slab, no frame -- per direct correction. `on_side_wall`
## picks which horizontal axis is the slab's thin (wall-facing) axis.
## `outward_sign` is which direction the room's interior lies relative to
## the wall along that axis, so the slab always sits proud of the wall into
## the room regardless of which of the three walls this is.
static func _gallery_painting(bay: Node3D, wall_position: Vector3, canvas_color: Color, on_side_wall: bool, outward_sign: float) -> void:
	var half_width := 1.275
	var half_height := 0.825
	if on_side_wall:
		_part(bay, Vector3(0.03, half_height, half_width), canvas_color, wall_position + Vector3(outward_sign * 0.16, 0, 0), "GalleryPaintingCanvas")
	else:
		_part(bay, Vector3(half_width, half_height, 0.03), canvas_color, wall_position + Vector3(0, 0, outward_sign * 0.16), "GalleryPaintingCanvas")

static func _build_upper_facade(bay: Node3D, index: int, center_x: float, color: Color) -> void:
	var upper_mid := (GROUND_CEILING + UPPER_TOP) * 0.5
	# The upper storey's front face sits at UPPER_FACADE_Z (the pillar
	# line), well forward of the ground floor's own FRONT_Z -- its back
	# face is unchanged, so the whole mass is deeper than the ground floor
	# beneath it, cantilevering out over the five-foot-way instead of
	# lining up with the recessed shopfront.
	var upper_half_depth := (UPPER_FACADE_Z - BACK_Z - 0.24) * 0.5
	var upper_center_z := (UPPER_FACADE_Z + BACK_Z) * 0.5
	# A real second-storey mass completes the architecture and gives the spring
	# arm a roof/ceiling collision surface to retract against indoors.
	_part(bay, Vector3(BAY_WIDTH * 0.5 - 0.12, (UPPER_TOP - GROUND_CEILING) * 0.5, upper_half_depth), color, Vector3(center_x, upper_mid, upper_center_z), "SolidUpperStorey")
	_collision(bay, Vector3(BAY_WIDTH - 0.24, UPPER_TOP - GROUND_CEILING, upper_half_depth * 2.0), Vector3(center_x, upper_mid, upper_center_z), "SolidUpperStoreyCollision")
	_build_shophouse_roof(bay, index, center_x)
	_part(bay, Vector3(BAY_WIDTH * 0.5, (UPPER_TOP - GROUND_CEILING) * 0.5, 0.28), color, Vector3(center_x, upper_mid, UPPER_FACADE_Z), "UpperFacade")
	for window_index in range(3):
		var window_x := center_x + (float(window_index) - 1.0) * 2.1
		_part(bay, Vector3(0.72, 1.15, 0.10), Color("f7efe5"), Vector3(window_x, 6.55, UPPER_FACADE_Z + 0.32), "UpperShutter")
		for slat_index in range(5):
			_part(bay, Vector3(0.58, 0.025, 0.035), color.darkened(0.28), Vector3(window_x, 5.95 + float(slat_index) * 0.28, UPPER_FACADE_Z + 0.45), "ShutterSlat")
	# Superegg rosettes and cornice translate the reference ornament without
	# importing a separate architectural shape language.
	for ornament_index in range(5):
		_part(bay, Vector3(0.16, 0.16, 0.07), Color("fff4e8"), Vector3(center_x - 3.0 + float(ornament_index) * 1.5, 8.15, UPPER_FACADE_Z + 0.40), "FacadeRosette")
	_part(bay, Vector3(BAY_WIDTH * 0.5 + 0.14, 0.15, 0.40), color.darkened(0.16), Vector3(center_x, UPPER_TOP, UPPER_FACADE_Z), "RoundedCornice")

## A real shophouse roof is two separate pitched sections -- a taller one
## over the front shop/hall block and a shorter one over the rear block --
## with an open-to-sky airwell gap between them, per direct reference
## (Singapore shophouse cutaway: Pitched Roof, Party Wall, Airwell, second
## Pitched Roof with Exposed Timber, Rear Court, in that order back from the
## street). The gap needs no extra geometry: it simply leaves
## SolidUpperStorey's own flat top exposed, the way a real airwell
## interrupts the roofline down to the floor below it.
static func _build_shophouse_roof(bay: Node3D, index: int, center_x: float) -> void:
	var roof_color: Color = ROOF_TILE_COLORS[index % ROOF_TILE_COLORS.size()]
	# Front eave now starts from the cantilevered upper storey's own forward
	# edge (UPPER_FACADE_Z), not the ground floor's FRONT_Z, so the roof
	# actually caps the mass it sits on.
	_build_gable_roof_section(bay, center_x, roof_color, 2.2, UPPER_FACADE_Z + 0.18, -5.5)
	_build_gable_roof_section(bay, center_x, roof_color, 1.5, -7.5, BACK_Z - 0.18)

## Builds one simple two-slope (gable) roof section: two flat rectangular
## panels tilted down from a shared ridge to the front and back eaves, plus
## a decorative ridge cap. Per direct correction, the ridge runs parallel to
## the front facade (across the bay's width, on the X axis) with the two
## slopes descending toward the street and the rear court -- not a ridge
## running front-to-back with slopes toward the party walls. Each panel is
## centered exactly on its own ridge-to-eave midpoint, so rotating it about
## that center by the pitch angle (this time about X, since the slope now
## runs along Z) is enough -- no separate pivot offset is needed.
static func _build_gable_roof_section(bay: Node3D, center_x: float, roof_color: Color, ridge_rise: float, front_edge_z: float, back_edge_z: float) -> void:
	var half_width := BAY_WIDTH * 0.5 + 0.22
	var run := absf(front_edge_z - back_edge_z) * 0.5
	var slope_length := sqrt(run * run + ridge_rise * ridge_rise)
	var slope_angle := atan2(ridge_rise, run)
	var ridge_z := (front_edge_z + back_edge_z) * 0.5
	for side in [-1.0, 1.0]:
		var edge_z: float = front_edge_z if side > 0.0 else back_edge_z
		var panel := _part(bay, Vector3(half_width, 0.05, slope_length * 0.5), roof_color, Vector3(center_x, UPPER_TOP + ridge_rise * 0.5, (ridge_z + edge_z) * 0.5), "ShophouseRoofSlope")
		panel.rotation.x = side * slope_angle
	_part(bay, Vector3(half_width + 0.05, 0.10, 0.12), ROOF_RIDGE_COLOR, Vector3(center_x, UPPER_TOP + ridge_rise + 0.08, ridge_z), "ShophouseRoofRidge")

static func _build_arcade_interior(root: Node3D) -> void:
	# Curved stage lip faces the room; screen sits against the back wall and the
	# microphone position remains intentionally close to the front edge.
	var stage := Node3D.new()
	stage.name = "KaraokuehStage"
	root.add_child(stage)
	_part(stage, Vector3(3.15, 0.24, 1.55), Color("6e315d"), Vector3(-12.0, 0.24, BACK_Z + 1.65), "CurvedStageDeck")
	_collision(stage, Vector3(6.3, 0.48, 3.1), Vector3(-12.0, 0.24, BACK_Z + 1.65), "StageSolid")
	# Three overlapping soft eggs form a visibly bowed front rather than a box.
	for x in [-2.2, 0.0, 2.2]:
		_part(stage, Vector3(1.35, 0.25, 0.48), Color("8d3f76"), Vector3(-12.0 + x, 0.25, BACK_Z + 3.02), "CurvedStageFront")
	_part(stage, Vector3(2.75, 1.35, 0.10), Color("18121d"), Vector3(-12.0, 2.35, BACK_Z + 0.20), "KaraokeScreen")
	_build_karaoke_wordmark(stage, Vector3(-12.0, 2.35, BACK_Z + 0.34))
	for light_x in [-14.2, -12.0, -9.8]:
		var spot_color: Color = Color("e457b4") if light_x != -12.0 else Color("69dce3")
		_flush_ceiling_lamp(stage, light_x, BACK_Z + 3.8, Color("24202b"), spot_color, 1.15, 5.5)
	# Carry the stage palette through the whole room as alternating wall washes.
	# Lower energy and shorter range preserve pockets of game-room darkness while
	# giving every exhibit a playful colored edge.
	var arcade_colors: Array[Color] = [Color("e457b4"), Color("69dce3"), Color("a98cff")]
	var wash_z_positions: Array[float] = [-7.2, -3.2, 1.2]
	for row_index in range(wash_z_positions.size()):
		for side_index in range(2):
			var side := -1.0 if side_index == 0 else 1.0
			var color := arcade_colors[(row_index + side_index) % arcade_colors.size()]
			var light_position := Vector3(-12.0 + side * 2.85, 3.45, wash_z_positions[row_index])
			_part(stage, Vector3(0.24, 0.10, 0.16), Color("24202b"), light_position, "ArcadeWallLightHousing", 0.18, 0.34)
			_part(stage, Vector3(0.17, 0.055, 0.11), color, light_position + Vector3(0, -0.12, 0.08), "ArcadeWallLightLens", 0.12, 0.22)
			var wash := OmniLight3D.new()
			wash.position = light_position + Vector3(-side * 0.18, -0.25, 0)
			wash.light_color = color
			wash.light_energy = 0.62
			wash.omni_range = 4.25
			stage.add_child(wash)

static func _build_gallery_interior(root: Node3D) -> void:
	var gallery := Node3D.new()
	gallery.name = "WhiteGalleryLighting"
	root.add_child(gallery)
	for light_position in [Vector3(-6.3, 4.05, 2.0), Vector3(-4.0, 4.05, -0.5), Vector3(-1.7, 4.05, 2.0)]:
		var light := OmniLight3D.new()
		light.position = light_position
		light.light_color = Color("fffaf1")
		light.light_energy = 1.85
		light.omni_range = 6.0
		light.shadow_enabled = true
		gallery.add_child(light)

static func _build_restaurant_interior(root: Node3D) -> void:
	_build_conveyor(root)
	_build_drink_station(root)
	_build_restaurant_furnishings(root)
	var lighting := Node3D.new()
	lighting.name = "RestaurantWarmLighting"
	root.add_child(lighting)
	for light_position in [Vector3(1.8, 4.0, 1.4), Vector3(6.1, 4.0, 1.4), Vector3(2.0, 4.0, -7.0), Vector3(6.0, 4.0, -7.0)]:
		var light := OmniLight3D.new()
		light.position = light_position
		light.light_color = Color("ffd9a8")
		light.light_energy = 1.5
		light.omni_range = 6.5
		light.shadow_enabled = true
		lighting.add_child(light)

static func _build_restaurant_furnishings(root: Node3D) -> void:
	var dining := Node3D.new()
	dining.name = "RestaurantFrontDiningArea"
	root.add_child(dining)
	# Shallow wall tables leave the central doorway-to-kitchen route open. Their
	# pale tops and sunny stools give the dining room a lighter coffeeshop feel.
	var table_color := Color("f4efe3")
	var table_edge := Color("c9bda9")
	var stool_color := Color("efc84f")
	for table_data in [
		{"position": Vector3(0.72, 0.78, 1.45), "side": 1.0},
		{"position": Vector3(7.28, 0.78, 1.45), "side": -1.0},
		{"position": Vector3(7.28, 0.78, -1.35), "side": -1.0},
	]:
		var table_position: Vector3 = table_data["position"]
		var stool_side: float = table_data["side"]
		_part(dining, Vector3(0.58, 0.08, 1.05), table_color, table_position, "WallDiningTableTop")
		_part(dining, Vector3(0.60, 0.035, 1.07), table_edge, table_position + Vector3(0, -0.10, 0), "DiningTableEdge")
		_part(dining, Vector3(0.12, 0.36, 0.12), table_edge.darkened(0.28), Vector3(table_position.x, 0.38, table_position.z), "WallDiningTableStem")
		for stool_z_offset in [-0.67, 0.67]:
			_part(dining, Vector3(0.30, 0.28, 0.30), stool_color, Vector3(table_position.x + stool_side * 0.83, 0.30, table_position.z + stool_z_offset), "TuckedDiningStool")
	# The rear half reads immediately as a separate washable kitchen zone.
	var tile_size := 0.48
	for tile_x in range(8):
		for tile_z in range(7):
			var tile_color := Color("f1eee5") if (tile_x + tile_z) % 2 == 0 else Color("60706f")
			_part(dining, Vector3(tile_size, 0.018, tile_size), tile_color, Vector3(0.52 + float(tile_x) * 0.99, 0.035, -5.85 - float(tile_z) * 0.99), "KitchenCheckerTile", 0.0, 0.72)
	# A few leafy pots soften the guest area while staying against the perimeter.
	# Each gets its own snake-plant variety (leaf shape and pot color) rather
	# than three identical copies.
	var plant_positions := [Vector3(0.65, 0, 3.45), Vector3(7.32, 0, 3.35), Vector3(7.32, 0, -3.55)]
	for plant_index in range(plant_positions.size()):
		_build_potted_plant(dining, plant_positions[plant_index], plant_index)
	# A stainless commercial-kitchen run meets both sides of Mei Jun's cooker
	# exactly. The 1.325 m work surface matches the range's cooktop below its
	# burners, and every rear edge is flush with the wall at z=-13.
	var stainless := Color("b9bec0")
	var stainless_dark := Color("747b7e")
	var stainless_light := Color("e4e7e6")
	var counter_top_y := 1.27
	for counter_x in [1.80, 6.20]:
		_part(dining, Vector3(1.70, 0.61, 0.55), stainless, Vector3(counter_x, 0.61, -12.45), "CommercialBaseCabinet")
		_collision(dining, Vector3(3.40, 1.22, 1.1), Vector3(counter_x, 0.61, -12.45), "KitchenCounterSolid")
		_part(dining, Vector3(1.70, 0.055, 0.55), stainless_light, Vector3(counter_x, counter_top_y, -12.45), "StainlessWorktop", 0.72, 0.22)
		# Three inset doors give the long base unit a believable modular rhythm.
		for door_index in range(3):
			var door_x: float = float(counter_x) - 1.10 + float(door_index) * 1.10
			_part(dining, Vector3(0.49, 0.49, 0.035), stainless_dark, Vector3(door_x, 0.61, -11.87), "CommercialCabinetDoor", 0.60, 0.28)
			_part(dining, Vector3(0.30, 0.025, 0.025), Color("edf0ef"), Vector3(door_x, 0.97, -11.82), "CabinetPull", 0.82, 0.18)
	# Washable steel backsplash and a broad extraction hood make the rear zone
	# read as a working commercial kitchen rather than domestic furniture.
	_part(dining, Vector3(3.86, 0.78, 0.045), Color("d7dbda"), Vector3(4.0, 2.05, -12.87), "CommercialBacksplash", 0.58, 0.28)
	_build_meijun_recipe_notes(dining)
	_part(dining, Vector3(1.20, 0.24, 0.42), stainless_dark, Vector3(4.0, 3.36, -12.53), "ExtractionHoodCanopy", 0.70, 0.24)
	_part(dining, Vector3(0.72, 0.62, 0.26), stainless, Vector3(4.0, 3.94, -12.69), "ExtractionHoodFlue", 0.68, 0.25)
	# Open wall shelves keep equipment visible without adding floor obstacles.
	for shelf_x in [1.75, 6.25]:
		for shelf_y in [2.48, 3.08]:
			_part(dining, Vector3(1.30, 0.055, 0.34), stainless_light, Vector3(shelf_x, shelf_y, -12.53), "StainlessWallShelf", 0.72, 0.20)
			_part(dining, Vector3(0.06, 0.30, 0.06), stainless_dark, Vector3(shelf_x - 1.05, shelf_y - 0.25, -12.72), "ShelfBracket", 0.62, 0.26)
			_part(dining, Vector3(0.06, 0.30, 0.06), stainless_dark, Vector3(shelf_x + 1.05, shelf_y - 0.25, -12.72), "ShelfBracket", 0.62, 0.26)
	# A compact sink occupies the right-hand run, with the rim level kept at the
	# same continuous worktop datum.
	_part(dining, Vector3(0.58, 0.025, 0.34), Color("596164"), Vector3(6.25, 1.335, -12.38), "InsetPrepSink", 0.62, 0.24)
	_part(dining, Vector3(0.055, 0.34, 0.055), stainless_dark, Vector3(6.25, 1.66, -12.68), "SinkTapStem", 0.76, 0.18)
	_part(dining, Vector3(0.18, 0.055, 0.055), stainless_dark, Vector3(6.25, 1.96, -12.53), "SinkTapSpout", 0.76, 0.18)

## Four small blank recipe slips connect the kitchen to Taste of Home's
## paper-and-masking-tape interface without turning the backsplash into a
## readable UI panel. They stay in the clear central steel band, below the
## hood and between the left/right shelf-and-bracket assemblies.
static func _build_meijun_recipe_notes(parent: Node3D) -> void:
	const BACKSPLASH_FRONT_Z := -12.825
	var notes := [
		{"position": Vector2(3.16, 1.78), "size": Vector2(0.13, 0.09), "angle": -3.5, "tape_angle": 2.0},
		{"position": Vector2(3.58, 2.24), "size": Vector2(0.12, 0.085), "angle": 2.0, "tape_angle": -3.0},
		{"position": Vector2(4.45, 2.48), "size": Vector2(0.14, 0.095), "angle": -1.5, "tape_angle": 3.5},
		{"position": Vector2(4.92, 1.92), "size": Vector2(0.125, 0.09), "angle": 3.0, "tape_angle": -2.0},
	]
	for note_index in range(notes.size()):
		var note_data: Dictionary = notes[note_index]
		var note_size: Vector2 = note_data["size"]
		var note_position: Vector2 = note_data["position"]
		var assembly := Node3D.new()
		assembly.name = "MeiJunRecipeNote%d" % note_index
		assembly.position = Vector3(note_position.x, note_position.y, BACKSPLASH_FRONT_Z)
		assembly.rotation.z = deg_to_rad(float(note_data["angle"]))
		parent.add_child(assembly)

		# A plain BoxMesh keeps the paper corners square rather than giving these
		# tiny utilitarian slips the rounded SuperEgg treatment. Its back face is
		# flush to the steel at local z=0.
		_flat_part(assembly, Vector3(note_size.x, note_size.y, 0.004), Color("fff8e9"), Vector3(0, 0, 0.004), "RecipePaper", 0.92)
		# The tape is deliberately a little imperfect in angle and width, but its
		# back face touches the paper front at local z=0.008 exactly.
		var tape := _flat_part(assembly, Vector3(note_size.x * 0.34, 0.025, 0.002), Color("e8d9a8"), Vector3(0, note_size.y - 0.004, 0.010), "MaskingTape", 0.86)
		tape.rotation.z = deg_to_rad(float(note_data["tape_angle"]))

## Shrinks every belt-run (local X) dimension so the whole assembly reads
## shorter without moving its center -- the previous full length crowded the
## kitchen counters just behind it (see BACK_Z's own counters at z=-12.45).
const CONVEYOR_LENGTH_SCALE := 0.74

static func _build_conveyor(root: Node3D) -> void:
	var conveyor := Node3D.new()
	conveyor.name = "VikisTwinLaneKuehConveyor"
	conveyor.position = Vector3(6.65, 0, -7.75)
	conveyor.rotation.y = PI * 0.5
	root.add_child(conveyor)
	var center := Vector3.ZERO
	var s := CONVEYOR_LENGTH_SCALE
	for lane_z in [-0.46, 0.46]:
		_part(conveyor, Vector3(2.55 * s, 0.11, 0.32), Color("3f4144"), center + Vector3(0, 0.92, lane_z), "MovingBeltLane", 0.34, 0.30)
		for roller_index in range(10):
			var x := center.x - 2.25 * s + float(roller_index) * (0.5 * s)
			_part(conveyor, Vector3(0.18, 0.13, 0.35), Color("777b7e"), Vector3(x, 0.91, center.z + lane_z), "BeltRoller", 0.62, 0.24)
		for kueh_index in range(4):
			var color: Color = [Color("d65b73"), Color("69b879"), Color("f0dfb7"), Color("8ccf9e")][kueh_index]
			var item := HubConveyorItem.new()
			item.name = "MovingConveyorKueh"
			item.setup(
				Vector3(center.x - 1.65 * s + float(kueh_index) * (1.05 * s), 1.18, center.z + lane_z),
				center.x - 2.15 * s,
				center.x + 2.15 * s,
				0.42 if lane_z < 0.0 else -0.42
			)
			conveyor.add_child(item)
			_part(item, Vector3(0.24, 0.13, 0.22), color, Vector3.ZERO, "ConveyorKueh")
	for leg_x in [-2.2 * s, 2.2 * s]:
		_part(conveyor, Vector3(0.12, 0.45, 0.72), Color("4b4e50"), center + Vector3(leg_x, 0.45, 0), "ConveyorLeg", 0.52, 0.28)
	# Enclosed intake and output heads hide the belt turnaround, so the moving
	# kueh emerge from and disappear into machinery rather than empty space.
	# The mouth is a real open notch framed into the machine body (see
	# _conveyor_end_machine), not a block sitting proud of its surface, so
	# the kueh visibly pass through an opening. Shifted further inward
	# (2.30 vs the belt's own 2.55 half-length) than a flush end-cap would
	# sit, per direct correction, so the kueh travel visibly deeper into
	# the machine before vanishing instead of disappearing right at its edge.
	for machine_x in [-2.30 * s, 2.30 * s]:
		_conveyor_end_machine(conveyor, machine_x)
		_part(conveyor, Vector3(0.24, 0.10, 0.62), Color("efc84f"), Vector3(machine_x, 1.69, 0), "ConveyorMachineBeacon", 0.20, 0.24)
		_collision(conveyor, Vector3(1.05, 1.84, 2.04), Vector3(machine_x, 0.92, 0), "ConveyorEndMachineSolid")
	_collision(conveyor, Vector3(5.4 * s, 1.15, 1.7), center + Vector3(0, 0.58, 0), "ConveyorSolid")

## Builds the grey end machine as a CSG box with the dark mouth opening
## subtracted out of it, rather than a separate dark box placed against its
## surface -- the kueh now visibly emerge from and disappear into a recess
## cut into the machine instead of a block stuck onto it.
## CSGMesh3D's boolean solver silently failed on SuperEgg's custom mesh (it
## handles native primitives like CSGBox3D reliably, but an arbitrary mesh
## needs to be manifold in exactly the way its solver expects) -- the whole
## machine body disappeared, leaving only the plain _part()-built beacon
## visible. Rebuilt with no CSG at all: a solid back block plus a frame of
## four SuperEgg segments around a genuinely empty notch, so the kueh still
## read as entering/exiting a real recess, using only the same _part()
## primitive already proven everywhere else in this file.
static func _conveyor_end_machine(conveyor: Node3D, machine_x: float) -> void:
	var center := Vector3(machine_x, 0.92, 0)
	var grey := Color("d7dbda")
	# inward points from the machine toward the belt's center -- the notch's
	# open face is on this side.
	var inward := -signf(machine_x)
	# The notch: a 0.32-deep slot cut into the machine's inward face, sized
	# to match the old mouth opening (0.60 tall, 1.52 wide, centered 0.10
	# above the machine's own vertical center). Its depth slice spans from
	# the inward face (offset 0.52) in to offset 0.20, so it's centered at
	# offset 0.36 with half-thickness 0.16.
	var notch_x_offset := 0.36 * inward
	var notch_half_x := 0.16
	var notch_world_y := center.y + 0.10
	var notch_half_y := 0.30
	var notch_half_z := 0.76
	# Back block: everything behind the notch (offset -0.52 to 0.20), full
	# height and width.
	_part(conveyor, Vector3(0.36, 0.92, 1.02), grey, center + Vector3(-0.16 * inward, 0, 0), "ConveyorEndMachineBack", 0.58, 0.27)
	# Front frame: four segments at the notch's own depth, surrounding (not
	# filling) its footprint. Top/bottom run the full width; left/right run
	# the full height, overlapping top/bottom slightly at the corners --
	# harmless for solid same-color material.
	var frame_center := center + Vector3(notch_x_offset, 0, 0)
	var top_half_y := ((center.y + 0.92) - (notch_world_y + notch_half_y)) * 0.5
	var top_center_y := (center.y + 0.92 + notch_world_y + notch_half_y) * 0.5
	var bottom_half_y := ((notch_world_y - notch_half_y) - (center.y - 0.92)) * 0.5
	var bottom_center_y := (notch_world_y - notch_half_y + center.y - 0.92) * 0.5
	_part(conveyor, Vector3(notch_half_x, top_half_y, 1.02), grey, Vector3(frame_center.x, top_center_y, 0), "ConveyorEndMachineTop", 0.58, 0.27)
	_part(conveyor, Vector3(notch_half_x, bottom_half_y, 1.02), grey, Vector3(frame_center.x, bottom_center_y, 0), "ConveyorEndMachineBottom", 0.58, 0.27)
	_part(conveyor, Vector3(notch_half_x, 0.92, (1.02 - notch_half_z) * 0.5), grey, Vector3(frame_center.x, center.y, -(notch_half_z + 1.02) * 0.5), "ConveyorEndMachineLeft", 0.58, 0.27)
	_part(conveyor, Vector3(notch_half_x, 0.92, (1.02 - notch_half_z) * 0.5), grey, Vector3(frame_center.x, center.y, (notch_half_z + 1.02) * 0.5), "ConveyorEndMachineRight", 0.58, 0.27)
	# A dark panel at the back of the notch reads as the recess's shadowed
	# interior -- the kueh visibly pass through an opening rather than a
	# block stuck onto the machine's surface.
	_part(conveyor, Vector3(0.02, notch_half_y, notch_half_z), Color("34383a"), Vector3(center.x + 0.20 * inward, notch_world_y, 0), "ConveyorMachineMouth", 0.18, 0.32)

static func _build_drink_station(root: Node3D) -> void:
	var station := Node3D.new()
	station.name = "NataliasKopitiamWaterCart"
	# Run the cart parallel to the restaurant's left wall and pull it toward
	# the kitchen, keeping the central dining route open.
	station.position = Vector3(0.95, 0, -4.15)
	station.rotation.y = PI * 0.5
	root.add_child(station)
	var center := Vector3.ZERO
	var wood := Color("8a512f")
	var wood_dark := Color("5b3422")
	var wood_light := Color("b77949")
	var steel := Color("c8cecd")
	# Paneled timber cabinet, stainless serving rim, and visible wheels establish
	# the familiar mobile kopitiam-cart silhouette from the references.
	_part(station, Vector3(1.18, 0.52, 0.52), wood, center + Vector3(0, 0.52, 0), "KopitiamCartCabinet")
	_part(station, Vector3(1.24, 0.055, 0.58), steel, center + Vector3(0, 1.08, 0), "KopitiamServingCounter", 0.60, 0.22)
	_collision(station, Vector3(2.36, 1.04, 1.04), center + Vector3(0, 0.52, 0), "DrinkCounterSolid")
	for panel_x in [-0.77, 0.0, 0.77]:
		_part(station, Vector3(0.32, 0.19, 0.035), wood_light, center + Vector3(panel_x, 0.68, 0.555), "CartFrontPanel")
		_part(station, Vector3(0.27, 0.025, 0.025), wood_dark, center + Vector3(panel_x, 0.86, 0.60), "CartDrawerPull", 0.20, 0.30)
	for post_x in [-1.03, 1.03]:
		for post_z in [-0.43, 0.43]:
			_part(station, Vector3(0.055, 1.02, 0.055), wood_dark, center + Vector3(post_x, 2.03, post_z), "KopitiamCanopyPost")
	# Teal fabric canopy with slightly lifted end caps.
	_part(station, Vector3(1.43, 0.10, 0.76), Color("167b78"), center + Vector3(0, 3.08, 0), "KopitiamCartCanopy", 0.0, 0.82)
	for canopy_x in [-1.42, 1.42]:
		var canopy_tip := _part(station, Vector3(0.16, 0.08, 0.76), Color("167b78"), center + Vector3(canopy_x, 3.13, 0), "KopitiamCanopyUpturn", 0.0, 0.82)
		canopy_tip.rotation.z = signf(canopy_x) * deg_to_rad(12.0)
	_cart_wheel(station, center + Vector3(-0.82, 0.42, 0.61), 0.48)
	_cart_wheel(station, center + Vector3(0.92, 0.31, 0.61), 0.30)
	# One recognizable countertop water dispenser replaces the loose glasses.
	_part(station, Vector3(0.34, 0.48, 0.36), Color("f4efe7"), center + Vector3(-0.48, 1.55, 0), "WaterDispenserBody")
	_part(station, Vector3(0.28, 0.34, 0.30), Color(0.55, 0.80, 0.92, 0.56), center + Vector3(-0.48, 2.30, 0), "WaterDispenserBottle", 0.0, 0.16)
	_part(station, Vector3(0.055, 0.10, 0.055), Color("5c7180"), center + Vector3(-0.48, 1.38, 0.39), "WaterDispenserTap", 0.35, 0.26)
	# Nested inverted cups overlap vertically like a real customer stack.
	for cup_index in range(5):
		var cup_mesh := CylinderMesh.new()
		cup_mesh.top_radius = 0.095
		cup_mesh.bottom_radius = 0.13
		cup_mesh.height = 0.18
		cup_mesh.radial_segments = 18
		var cup := MeshInstance3D.new()
		cup.name = "InvertedCupStack"
		cup.mesh = cup_mesh
		cup.position = center + Vector3(0.48, 1.18 + float(cup_index) * 0.055, 0.18)
		cup.material_override = HubPalette.material(Color("fffaf2"), 0.0, 0.48)
		station.add_child(cup)
	# A small platter of kueh lupis alongside the dispenser and cups -- a nod
	# to Natalia's actual project (a kueh lupis water-intake tracker), not
	# just a generic water stand. Shifted off to the station's own +X side
	# (the cart is rotated 90 degrees, so +X here is world -Z, toward the
	# back of the shop) -- it was clipping into the water dispenser at
	# local x=-0.48.
	var platter_x := 0.40
	_part(station, Vector3(0.30, 0.02, 0.20), Color("f4efe7"), center + Vector3(platter_x, 1.16, -0.30), "KuehLupisPlatter", 0.0, 0.42)
	for lupis_index in range(3):
		var lupis_x := platter_x - 0.16 + float(lupis_index) * 0.16
		_part(station, Vector3(0.065, 0.05, 0.065), Color("2f5d34"), center + Vector3(lupis_x, 1.205, -0.30), "KuehLupisWrap", 0.0, 0.70)
		_part(station, Vector3(0.05, 0.03, 0.05), Color("f6ecd8"), center + Vector3(lupis_x, 1.25, -0.30), "KuehLupisRiceTop", 0.0, 0.50)

static func _cart_wheel(parent: Node3D, position: Vector3, radius: float) -> void:
	var tire_mesh := TorusMesh.new()
	tire_mesh.inner_radius = radius * 0.76
	tire_mesh.outer_radius = radius
	tire_mesh.rings = 24
	tire_mesh.ring_segments = 12
	var tire := MeshInstance3D.new()
	tire.name = "KopitiamCartWheel"
	tire.mesh = tire_mesh
	tire.position = position
	tire.rotation.x = PI * 0.5
	tire.material_override = HubPalette.material(Color("3d3029"), 0.0, 0.72)
	parent.add_child(tire)
	for spoke_index in range(8):
		var spoke := _part(parent, Vector3(radius * 0.72, 0.022, 0.022), Color("b77949"), position + Vector3(0, 0, 0.015), "CartWheelSpoke", 0.12, 0.38)
		spoke.rotation.z = float(spoke_index) * PI / 8.0
	_part(parent, Vector3(radius * 0.12, radius * 0.12, 0.07), Color("5b3422"), position + Vector3(0, 0, 0.04), "CartWheelHub", 0.18, 0.34)

# One pot/rim color pair per plant variety, per direct reference (snake
# plants photographed in an orange, a teal, and a pink pot respectively).
const PLANT_POT_PALETTE := [
	{"pot": Color("d97b3f"), "rim": Color("a85c2a")},
	{"pot": Color("2f7a82"), "rim": Color("1f545a")},
	{"pot": Color("c96f86"), "rim": Color("9c4f63")},
]

## Real snake-plant leaves are flat blades, not chunky rounded boxes, and
## they rise directly out of the pot rim rather than floating above it --
## per direct correction. `variant` also picks a distinct leaf shape per
## plant, echoing the reference photo's different snake-plant varieties
## (a broad yellow-edged Laurentii, narrow upright Cylinder rods, and a
## twisted, flatter Twisted Sister).
## _part() can only place a box centered at a given point, but a leaf needs
## its BASE anchored where it actually emerges from the pot -- per direct
## correction, the previous version rotated each leaf about its own center,
## which swung the base outward exactly as much as the tip, reading as a
## wide-based, inward-tapering teepee instead of a plant. This anchors the
## base at a fixed point and leans the leaf out from there, so increasing
## `lean` only ever flares the tip further from the pot; the base never
## moves. `twist` adds an extra spin around the leaf's own vertical axis,
## for varieties like Twisted Sister.
static func _fanned_leaf(parent: Node3D, base: Vector3, outward_dir: Vector2, lean: float, twist: float, size_xz: Vector2, height: float, color: Color) -> MeshInstance3D:
	var axis := Vector3(outward_dir.y, 0.0, -outward_dir.x)
	var leaf_basis := Basis(axis, lean).rotated(Vector3.UP, twist)
	var half_up := leaf_basis * Vector3(0, height * 0.5, 0)
	var leaf := _part(parent, Vector3(size_xz.x * 0.5, height * 0.5, size_xz.y * 0.5), color, base + half_up, "DiningPlantLeaf", 0.0, 0.62)
	leaf.transform.basis = leaf_basis
	return leaf

static func _build_potted_plant(parent: Node3D, position: Vector3, variant: int) -> void:
	var palette: Dictionary = PLANT_POT_PALETTE[variant % PLANT_POT_PALETTE.size()]
	_part(parent, Vector3(0.30, 0.30, 0.30), palette["pot"], position + Vector3(0, 0.30, 0), "DiningPlantPot", 0.0, 0.72)
	_part(parent, Vector3(0.22, 0.06, 0.22), palette["rim"], position + Vector3(0, 0.61, 0), "DiningPlantPotRim", 0.0, 0.70)
	# Cover the pot and low leaf cluster so neither the street nor restaurant
	# plants can be walked through.
	_collision(parent, Vector3(0.68, 1.15, 0.68), position + Vector3(0, 0.575, 0), "PottedPlantSolid")
	var rim_y := 0.64
	match variant % 3:
		0:
			# Laurentii-style: broad, flat blades fanned outward from a tight
			# cluster at the rim, each with a variegated yellow edge running
			# up one side.
			var leaf_color := Color("5f955f")
			var edge_color := Color("e4ce64")
			for leaf_data in [
				{"angle": -1.1, "radius": 0.06, "height": 0.60, "width": 0.16, "lean": 0.40},
				{"angle": 0.6, "radius": 0.07, "height": 0.72, "width": 0.17, "lean": 0.46},
				{"angle": 2.0, "radius": 0.05, "height": 0.52, "width": 0.15, "lean": 0.36},
				{"angle": 3.7, "radius": 0.07, "height": 0.66, "width": 0.16, "lean": 0.44},
			]:
				var outward := Vector2.RIGHT.rotated(leaf_data["angle"])
				var base: Vector3 = position + Vector3(outward.x * leaf_data["radius"], rim_y, outward.y * leaf_data["radius"])
				var height: float = leaf_data["height"]
				var width: float = leaf_data["width"]
				var leaf := _fanned_leaf(parent, base, outward, leaf_data["lean"], 0.0, Vector2(width, 0.028), height, leaf_color)
				var edge_base := base + leaf.transform.basis * Vector3(width * 0.42, 0.0, 0.001)
				_fanned_leaf(parent, edge_base, outward, leaf_data["lean"], 0.0, Vector2(0.04, 0.03), height * 0.96, edge_color)
		1:
			# Cylinder Snake Plant-style: several narrow, near-vertical rods
			# in a tight ring, barely leaning at all.
			var leaf_color := Color("4f8768")
			for rod_index in range(6):
				var angle := float(rod_index) / 6.0 * TAU
				var outward := Vector2.RIGHT.rotated(angle)
				var base := position + Vector3(outward.x * 0.07, rim_y, outward.y * 0.07)
				var height := 0.70 + fmod(float(rod_index) * 0.11, 0.22)
				_fanned_leaf(parent, base, outward, 0.10, 0.0, Vector2(0.09, 0.09), height, leaf_color)
		_:
			# Twisted Sister-style: fewer, flatter blades that fan out more
			# dramatically, each with a visible twist along its own length.
			var leaf_color := Color("5b8e6d")
			for leaf_data in [
				{"angle": -0.6, "radius": 0.05, "height": 0.58, "lean": 0.52, "twist": 0.9},
				{"angle": 1.4, "radius": 0.06, "height": 0.68, "lean": 0.58, "twist": -0.7},
				{"angle": 3.2, "radius": 0.05, "height": 0.50, "lean": 0.46, "twist": 1.1},
			]:
				var outward := Vector2.RIGHT.rotated(leaf_data["angle"])
				var base: Vector3 = position + Vector3(outward.x * leaf_data["radius"], rim_y, outward.y * leaf_data["radius"])
				_fanned_leaf(parent, base, outward, leaf_data["lean"], leaf_data["twist"], Vector2(0.15, 0.026), leaf_data["height"], leaf_color)

static func _glass(parent: Node3D, position: Vector3) -> void:
	var glass_mesh := CylinderMesh.new()
	glass_mesh.top_radius = 0.12
	glass_mesh.bottom_radius = 0.09
	glass_mesh.height = 0.34
	glass_mesh.radial_segments = 18
	var node := MeshInstance3D.new()
	node.name = "WaterGlass"
	node.mesh = glass_mesh
	node.position = position
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.68, 0.88, 0.96, 0.48)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.roughness = 0.16
	node.material_override = material
	parent.add_child(node)

static func add_pole_support(display: Node3D) -> void:
	_hide_pedestal(display)
	_part(display, Vector3(0.34, 0.08, 0.34), Color("28292c"), Vector3(0, 0.08, 0), "WeightedPoleBase", 0.22, 0.34)
	var pole := CylinderMesh.new()
	pole.top_radius = 0.045
	pole.bottom_radius = 0.055
	pole.height = 0.72
	var pole_node := MeshInstance3D.new()
	pole_node.name = "GachaPoleStand"
	pole_node.mesh = pole
	pole_node.position.y = 0.44
	pole_node.material_override = HubPalette.material(Color("aeb3b6"), 0.72, 0.22)
	display.add_child(pole_node)

static func add_boombox_table(display: Node3D) -> void:
	_hide_pedestal(display)
	var shell := Color("202632")
	var shell_light := Color("8797a8")
	var lime := Color("c2f02e")
	var purple := Color("a98cff")
	var cyan := Color("7bdcff")
	# The Remember.fm stereo becomes the center monitor of a substantial DJ
	# console rather than sitting alone on domestic furniture.
	_part(display, Vector3(1.58, 0.55, 0.42), shell, Vector3(0, 0.55, 0.05), "RetroDJBoothFront", 0.18, 0.34)
	_part(display, Vector3(1.68, 0.07, 0.56), shell_light, Vector3(0, 1.13, 0), "RetroDJCounter", 0.52, 0.24)
	_part(display, Vector3(1.48, 0.055, 0.035), lime, Vector3(0, 0.70, 0.49), "RememberFmBoothLightStrip", 0.10, 0.24)
	_collision(display, Vector3(3.18, 1.18, 0.92), Vector3(0, 0.59, 0.04), "DJBoothSolid")
	var stereo := display.find_child("SamanthasRememberFmStereo", true, false) as Node3D
	if stereo != null:
		stereo.get_parent().remove_child(stereo)
		stereo.free()
	# Twin turntables and a central mixer retain the project's sharp Y2K
	# hardware language while reading immediately as DJ equipment.
	for deck_x in [-0.88, 0.88]:
		_part(display, Vector3(0.48, 0.07, 0.34), Color("111316"), Vector3(deck_x, 1.27, 0.18), "TurntableDeck", 0.32, 0.28)
		_dj_disc(display, Vector3(deck_x, 1.36, 0.18), purple if deck_x < 0.0 else cyan, "VinylPlatter")
	_part(display, Vector3(0.28, 0.08, 0.36), Color("111316"), Vector3(0, 1.29, 0.18), "DJMixer", 0.32, 0.26)
	for control_index in range(5):
		_part(display, Vector3(0.025, 0.035, 0.025), lime if control_index % 2 == 0 else purple, Vector3(-0.16 + float(control_index) * 0.08, 1.39, 0.19), "MixerControl")
	# Raised laptop echoes the retro project's screen-based music archive.
	_part(display, Vector3(0.48, 0.34, 0.035), shell_light, Vector3(-0.66, 1.74, -0.24), "DJLaptopScreen", 0.44, 0.26)
	_part(display, Vector3(0.40, 0.27, 0.025), Color("111316"), Vector3(-0.66, 1.74, -0.20), "DJLaptopDisplay", 0.12, 0.30)
	_part(display, Vector3(0.14, 0.035, 0.02), lime, Vector3(-0.66, 1.74, -0.16), "DJLaptopWaveform")
	# Large floor speakers flank the booth, leaving Samantha a protected pocket
	# behind the console and projecting toward the center of the arcade.
	for speaker_x in [-2.05, 2.05]:
		_part(display, Vector3(0.52, 1.16, 0.42), shell, Vector3(speaker_x, 1.16, -0.02), "LargeRetroSpeaker", 0.24, 0.36)
		_collision(display, Vector3(1.04, 2.32, 0.84), Vector3(speaker_x, 1.16, -0.02), "LargeSpeakerSolid")
		_speaker_cone(display, Vector3(speaker_x, 0.78, 0.43), 0.34, purple, "SpeakerWoofer")
		_speaker_cone(display, Vector3(speaker_x, 1.62, 0.43), 0.20, cyan, "SpeakerTweeter")
		_part(display, Vector3(0.42, 0.045, 0.045), lime, Vector3(speaker_x, 2.12, 0.44), "SpeakerStatusLight")
	for light_data in [
		{"position": Vector3(-1.6, 2.55, 0.55), "color": purple},
		{"position": Vector3(1.6, 2.55, 0.55), "color": cyan},
	]:
		var light := OmniLight3D.new()
		light.position = light_data["position"]
		light.light_color = light_data["color"]
		light.light_energy = 0.85
		light.omni_range = 3.4
		display.add_child(light)

static func add_beary_chair(display: Node3D) -> void:
	_hide_pedestal(display)
	var caramel := Color("a9764f")
	var caramel_dark := Color("6b4423")
	var cushion := Color("e8998d")
	# A low café chair turns Amanda's original seated teddy into a welcoming
	# storefront mascot rather than another museum-plinth display.
	_part(display, Vector3(0.72, 0.12, 0.62), cushion, Vector3(0, 0.50, 0), "BearyChairCushion")
	_part(display, Vector3(0.78, 0.68, 0.12), caramel, Vector3(0, 1.12, -0.48), "BearyChairBack")
	for leg_x in [-0.58, 0.58]:
		for leg_z in [-0.42, 0.42]:
			_part(display, Vector3(0.09, 0.24, 0.09), caramel_dark, Vector3(leg_x, 0.24, leg_z), "BearyChairLeg")
	for arm_x in [-0.78, 0.78]:
		_part(display, Vector3(0.09, 0.10, 0.62), caramel, Vector3(arm_x, 0.92, 0), "BearyChairArm")
		_part(display, Vector3(0.09, 0.30, 0.09), caramel_dark, Vector3(arm_x, 0.66, -0.40), "BearyChairArmPost")
	_collision(display, Vector3(1.72, 1.48, 1.30), Vector3(0, 0.74, -0.02), "BearyChairSolid")
	var bear := display.find_child("AmandasSeatedPlushBear", true, false) as Node3D
	if bear != null:
		bear.position = Vector3(0, 0.62, 0.02)

static func _dj_disc(parent: Node3D, position: Vector3, color: Color, disc_name: String) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.30
	mesh.bottom_radius = 0.30
	mesh.height = 0.045
	mesh.radial_segments = 28
	var node := MeshInstance3D.new()
	node.name = disc_name
	node.mesh = mesh
	node.position = position
	node.material_override = HubPalette.material(color, 0.48, 0.24)
	parent.add_child(node)

static func _speaker_cone(parent: Node3D, position: Vector3, radius: float, color: Color, cone_name: String) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius * 0.72
	mesh.bottom_radius = radius
	mesh.height = 0.10
	mesh.radial_segments = 28
	var node := MeshInstance3D.new()
	node.name = cone_name
	node.mesh = mesh
	node.position = position
	node.rotation.x = PI * 0.5
	node.material_override = HubPalette.material(color, 0.22, 0.34)
	parent.add_child(node)

static func _hide_pedestal(display: Node3D) -> void:
	var column := display.find_child("MuseumPlinthColumn", true, false) as MeshInstance3D
	if column != null:
		column.visible = false
	var solid := display.find_child("PedestalSolidBody", true, false) as CollisionObject3D
	if solid != null:
		solid.collision_layer = 0

static func _anchor(parent: Node3D, anchor_name: String, position: Vector3) -> Node3D:
	var node := Node3D.new()
	node.name = anchor_name
	node.position = position
	parent.add_child(node)
	return node

static func _part(parent: Node3D, axes: Vector3, color: Color, position: Vector3, part_name: String, metallic := 0.0, roughness := 0.58) -> MeshInstance3D:
	var node := SuperEgg.build_part(axes, color, SuperEgg.EPSILON_FLAT, SuperEgg.EPSILON_FLAT)
	node.name = part_name
	node.position = position
	node.material_override = HubPalette.material(color, metallic, roughness)
	parent.add_child(node)
	return node

static func _flat_part(parent: Node3D, half_size: Vector3, color: Color, position: Vector3, part_name: String, roughness := 0.58) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = half_size * 2.0
	var node := MeshInstance3D.new()
	node.name = part_name
	node.mesh = mesh
	node.position = position
	node.material_override = HubPalette.material(color, 0.0, roughness)
	parent.add_child(node)
	return node

static func _collision(parent: Node3D, size: Vector3, position: Vector3, collision_name: String) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = collision_name
	body.collision_layer = 1
	body.collision_mask = 0
	body.position = position
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	parent.add_child(body)
	return body

static func _build_karaoke_wordmark(parent: Node3D, center: Vector3) -> void:
	var logo := Node3D.new()
	logo.name = "KaixinsKaraOKuehWordmark"
	parent.add_child(logo)
	# This is the title treatment authored in Kaixin's project: Anton with two
	# hard offset layers, cream/pink/blue on the first half and
	# yellow/red/blue on KUEH. The dots remain solid yellow.
	_layered_logo_segment(logo, "KARA", center + Vector3(-1.68, 0, 0), Color("fff7e8"), Color("ff2e93"), Color("2957ff"))
	_layered_logo_segment(logo, "O", center + Vector3(-0.20, 0, 0), Color("fff7e8"), Color("ff2e93"), Color("2957ff"))
	_layered_logo_segment(logo, "KUEH", center + Vector3(1.45, 0, 0), Color("ffd400"), Color("ff4b26"), Color("2957ff"))
	_logo_label(logo, "•", center + Vector3(-0.80, 0, 0.10), Color("ffd400"))
	_logo_label(logo, "•", center + Vector3(0.43, 0, 0.10), Color("ffd400"))

static func _layered_logo_segment(parent: Node3D, text: String, position: Vector3, front: Color, middle: Color, back: Color) -> void:
	# Label3D uses transparent glyph textures, so tiny depth differences can
	# still sort as one surface. A full 4 cm between layers gives the renderer
	# an unambiguous back-to-front order at every camera angle.
	_logo_label(parent, text, position + Vector3(0.12, -0.12, 0.01), back)
	_logo_label(parent, text, position + Vector3(0.06, -0.06, 0.05), middle)
	_logo_label(parent, text, position + Vector3(0, 0, 0.09), front)

static func _logo_label(parent: Node3D, text: String, position: Vector3, color: Color) -> Label3D:
	var label := Label3D.new()
	label.name = "KaraOKueh" + text.to_pascal_case() + "Layer"
	label.text = text
	label.font = KARAOKE_LOGO_FONT
	label.font_size = 64
	label.pixel_size = 0.0105
	label.modulate = color
	label.outline_size = 0
	label.position = position
	label.shaded = false
	label.double_sided = true
	parent.add_child(label)
	return label

static func _sign(parent: Node3D, text: String, position: Vector3, color: Color, pixel_size: float, glow := false) -> Label3D:
	var label := Label3D.new()
	label.name = text.to_pascal_case() + "Sign"
	label.text = text
	label.font_size = 64
	label.font = SIGN_FONT
	label.pixel_size = pixel_size
	# Pushing modulate past 1.0 is what actually blooms under the
	# environment's glow pass (see hub_main.gd's _build_environment) --
	# every other sign's color stays within 0..1, which the glow pass
	# ignores, so only a sign marked `glow` visibly lights up.
	label.modulate = color * 2.8 if glow else color
	label.outline_size = 0
	label.position = position
	label.shaded = false
	label.double_sided = true
	# SIGN_FONT (Bebas Neue) is already genuinely condensed -- no faux
	# horizontal squash needed on top of it.
	parent.add_child(label)
	return label
