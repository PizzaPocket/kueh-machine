extends SceneTree

## One-off dev tool: photographs the landing page's hero artwork, the same
## way ItemPortrait.gd photographs eleblorb's shop/inventory icons -- build
## real geometry into a temporary SubViewport, point a Camera3D at it, render
## a couple of frames, then Image.save_png() the result. Run headlessly and
## saved straight to a file instead of cached as a live UI texture, since
## this is a static marketing asset baked once, not a runtime capture:
##
##   /Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/hub --script res://scripts/hero_photo.gd
##
## Composition, per direct instruction: two randomly-appearanced Kuehverse
## figures caught mid-stride and mid-conversation, cropped to their upper
## bodies and pushed toward the left third of the frame; a floating
## rectangular kueh lapis slice -- red/white/green, nine tight-banded layers
## -- fills the right side. Reuses the exact rig (FigureBuilder/
## ProceduralFigure) and lighting recipe (hub_main.gd's _build_environment())
## the Hub itself renders with, so the hero image and the world it links to
## read as the same place.

const OUTPUT_PATH := "/Users/leonard/dev/kueh-machine/images/landing/hero.png"
const WIDTH := 2400
const HEIGHT := 1600
## Fixed, not randomize()'d -- this bakes one specific pair of figures into a
## static file; re-running the script should reproduce the same image rather
## than silently drifting until someone likes a result and forgets the seed.
const APPEARANCE_SEED := 20260830

const LAPIS_COLORS := [
	Color("d6203a"), Color("f8f2e4"), Color("2f8c46"), Color("f8f2e4"),
	Color("d6203a"), Color("f8f2e4"), Color("2f8c46"), Color("f8f2e4"),
	Color("d6203a"),
]
## Fraction of one band's height spent blending into the next band, split
## across both of that band's edges -- small, per "very tight transitions
## between layers" (a sticky-jelly kueh lapis reads as flat color bands with
## a thin wet seam between them, not a smooth vertical gradient).
const LAPIS_BLEND_FRACTION := 0.16


func _init() -> void:
	_run()


func _run() -> void:
	var viewport := SubViewport.new()
	viewport.size = Vector2i(WIDTH, HEIGHT)
	viewport.transparent_bg = false
	viewport.world_3d = World3D.new()
	viewport.msaa_3d = Viewport.MSAA_4X
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	# FigureBuilder.build()'s `parent` argument is typed Node3D; a SubViewport
	# itself isn't one, so everything mounts under one Node3D world root
	# instead (matches ItemPortrait.gd's own viewport.add_child(visual)
	# pattern one level down).
	var world := Node3D.new()
	viewport.add_child(world)

	_build_environment(viewport)

	var rng := RandomNumberGenerator.new()
	rng.seed = APPEARANCE_SEED

	# Every earlier "strafe" so far actually re-aimed at a fixed world point
	# from a new position each time -- an orbit/arc, not a strafe. A real
	# first-person-camera strafe holds ORIENTATION fixed and only translates
	# sideways along the camera's own local right/left axis, per direct
	# clarification. So: fix the look direction once, from the last render's
	# position/target, then slide left along that fixed orientation's own
	# right vector instead of re-solving look_at from a new spot.
	var base_camera_position := Vector3(-0.6, 1.5, 2.5)
	var base_camera_target := Vector3(-0.05, 1.32, 0.0)
	var camera_basis := Basis.looking_at(base_camera_target - base_camera_position, Vector3.UP)
	var strafe_left_amount := 0.6
	var camera_position := base_camera_position - camera_basis.x * strafe_left_amount

	var pos_a := Vector3(-1.05, 0.0, 0.25)
	var pos_b := Vector3(-0.45, 0.0, -0.25)
	var figure_a := FigureBuilder.build(world, _random_appearance(rng))
	var figure_b := FigureBuilder.build(world, _random_appearance(rng))
	# Base yaw faces the camera (same atan2(dx,dz) toward-a-point formula
	# hub_npc.gd's own setup() already uses to aim a figure inward -- trusted
	# rather than re-guessed), then a small extra turn toward the other
	# figure layers the "glancing at each other mid-conversation" read on
	# top, instead of a flat, identical stare into the lens for both.
	_pose_talking_stride(figure_a, -1, pos_a, _yaw_toward(pos_a, camera_position) - deg_to_rad(18.0), 0.5)
	_pose_talking_stride(figure_b, 1, pos_b, _yaw_toward(pos_b, camera_position) + deg_to_rad(20.0), -0.45)

	# Depth (local Z) pushed well past width (local X) per direct
	# instruction -- more than double it, a genuine log/prism proportion
	# rather than a slab, so the box reads as three-dimensional from a much
	# wider range of camera angles instead of needing one exact azimuth to
	# reveal any depth at all.
	var lapis := _build_lapis(Vector3(0.21, 0.47, 0.55))
	lapis.position = Vector3(0.65, 1.35, 0.35)
	lapis.rotation_degrees = Vector3(4.0, -38.0, 6.0)
	world.add_child(lapis)

	var camera := Camera3D.new()
	camera.fov = 42.0
	camera.transform = Transform3D(camera_basis, camera_position)
	camera.current = true
	world.add_child(camera)

	await process_frame
	await process_frame
	await process_frame

	var image := viewport.get_texture().get_image()
	var dir := DirAccess.open(OUTPUT_PATH.get_base_dir())
	if dir == null:
		DirAccess.make_dir_recursive_absolute(OUTPUT_PATH.get_base_dir())
	image.save_png(OUTPUT_PATH)
	print("Saved hero photo: " + OUTPUT_PATH)
	quit()


## Same three-light recipe as hub_main.gd's _build_environment() (warm key +
## soft secondary + cool rim, off-white ACES-toned background) so the hero
## photo and the Hub it links into read as one continuous lighting world
## rather than two different renders stitched together.
func _build_environment(viewport: SubViewport) -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("f4f2ed")
	environment.background_energy_multiplier = 1.0
	environment.tonemap_mode = Environment.TONE_MAPPER_ACES
	environment.tonemap_exposure = 0.86
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("e8edf2")
	environment.ambient_light_energy = 0.22
	environment.ambient_light_sky_contribution = 0.0
	environment.glow_enabled = true
	environment.glow_intensity = 0.9
	environment.glow_bloom = 0.0
	environment.glow_hdr_threshold = 1.2
	environment.fog_enabled = false
	world_environment.environment = environment
	viewport.add_child(world_environment)

	var key_light := DirectionalLight3D.new()
	key_light.rotation_degrees = Vector3(-52, -38, 0)
	key_light.light_color = Color("fff1df")
	key_light.light_energy = 0.62
	key_light.light_angular_distance = 3.5
	viewport.add_child(key_light)

	var secondary_light := DirectionalLight3D.new()
	secondary_light.rotation_degrees = Vector3(-38, 82, 0)
	secondary_light.light_color = Color("edf3f7")
	secondary_light.light_energy = 0.22
	secondary_light.light_angular_distance = 5.0
	viewport.add_child(secondary_light)

	var rim_light := DirectionalLight3D.new()
	rim_light.rotation_degrees = Vector3(-28, 142, 0)
	rim_light.light_color = Color("dce9f5")
	rim_light.light_energy = 0.14
	viewport.add_child(rim_light)


## Same option space CharacterEditor exposes -- a fresh random pick, exactly
## like hub_main.gd's _random_player_appearance() gives a signed-out visitor.
## Duplicated rather than called directly since that one is an instance
## method on Hub's own main node, which this standalone capture never
## instantiates.
func _random_appearance(rng: RandomNumberGenerator) -> Dictionary:
	var body_preset: String = CharacterEditor.BODY_PRESETS.keys()[rng.randi_range(0, CharacterEditor.BODY_PRESETS.size() - 1)]
	var skin := Color(CharacterEditor.SKIN_SWATCHES[rng.randi_range(0, CharacterEditor.SKIN_SWATCHES.size() - 1)])
	var hair := Color(CharacterEditor.HAIR_SWATCHES[rng.randi_range(0, CharacterEditor.HAIR_SWATCHES.size() - 1)])
	var hair_style: String = CharacterEditor.HAIR_STYLES[rng.randi_range(0, CharacterEditor.HAIR_STYLES.size() - 1)]["value"]
	var glasses_choice: String = ["none", "rect", "round", "head"][rng.randi_range(0, 3)]
	var sleeve_style: String = ["none", "short", "colored_upper_arm", "long"][rng.randi_range(0, 3)]
	var top := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	var bottom := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	var shoes := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	var wears_dress := body_preset == "soft" and rng.randf() < 0.5
	var result := {
		"body_preset": body_preset, "height_scale": 1.0,
		"skin": skin, "hair": hair, "hair_style": hair_style,
		"glasses": glasses_choice != "none",
		"round_glasses": glasses_choice == "round",
		"glasses_on_hair": glasses_choice == "head",
		"sleeve_style": sleeve_style, "top": top,
		"dress": wears_dress, "bottom": bottom, "shoes": shoes,
	}
	result.merge(CharacterEditor.BODY_PRESETS.get(body_preset, CharacterEditor.BODY_PRESETS["slim"]), true)
	return result


## Same construction as hub_npc.gd's setup() ("Aim each full figure at the
## center... var inward := Vector3.ZERO - global_position; var inward_yaw :=
## atan2(inward.x, inward.z)") -- generalized to any target point instead of
## always the world origin.
func _yaw_toward(from: Vector3, to: Vector3) -> float:
	var inward := to - from
	return atan2(inward.x, inward.z)


## Hand-posed, not simulated -- a single caught instant, not a running walk
## cycle. `side` (-1/1) mirrors the stride and picks which arm gestures (the
## inner arm, facing the other figure, per "talking to each other"), so the
## two figures don't mirror each other identically. `head_yaw` turns the
## head toward the other figure; `lean_side` gives the torso a small
## opposite-of-stride counter-rotation so the pose reads as a caught moment
## rather than a stiff mannequin.
func _pose_talking_stride(figure: Dictionary, side: int, world_position: Vector3, facing_yaw: float, head_yaw: float) -> void:
	var root := figure["root"] as Node3D
	root.position = world_position
	root.rotation.y = facing_yaw

	var swing := 0.42 * side
	(figure["leg_left"] as Node3D).rotation.x = swing
	(figure["leg_right"] as Node3D).rotation.x = -swing
	# The trailing leg (the one swung backward) is the one that bends at the
	# knee mid-stride; the leading leg stays nearly straight.
	var bent_knee: Node3D = figure["knee_right"] if side > 0 else figure["knee_left"]
	var straight_knee: Node3D = figure["knee_left"] if side > 0 else figure["knee_right"]
	bent_knee.rotation.x = ProceduralFigure.KNEE_BEND_AMOUNT * 0.85
	straight_knee.rotation.x = 0.05

	# Outer arm keeps a plain opposite-of-leg swing; inner arm (the one
	# nearer camera and nearer the other figure) bends and lifts into a
	# mid-gesture instead, selling the conversation rather than a plain walk.
	var outer_arm: Node3D = figure["arm_right"] if side > 0 else figure["arm_left"]
	var inner_arm: Node3D = figure["arm_left"] if side > 0 else figure["arm_right"]
	var outer_elbow: Node3D = figure["elbow_right"] if side > 0 else figure["elbow_left"]
	var inner_elbow: Node3D = figure["elbow_left"] if side > 0 else figure["elbow_right"]
	outer_arm.rotation.x = -swing
	outer_elbow.rotation.x = -0.18
	inner_arm.rotation.x = -0.95
	inner_arm.rotation.z = -side * 0.22
	inner_elbow.rotation.x = -0.85

	(figure["spine"] as Node3D).rotation.x = 0.05
	(figure["spine"] as Node3D).rotation.z = -side * 0.02
	(figure["head"] as Node3D).rotation.y = head_yaw
	(figure["head"] as Node3D).rotation.x = -0.03


## Built as a stack of thin, mostly-flat-colored quads (a few short gradient
## seams at the band boundaries) rather than a textured box -- the flat
## middle of each band and the short lerp at its edges directly express
## "very tight transitions between layers" as geometry/vertex-color, with no
## texture-space UV-seam risk across the box's four different side faces
## (see shophouse_street.gd's own FIVE_FOOT_WAY_WIDTH/_DEPTH comment for the
## kind of UV-alignment bug a textured box would otherwise risk here).
## `half_extents` is (half-width X, half-height Y, half-depth Z).
func _build_lapis(half_extents: Vector3) -> MeshInstance3D:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var segments := _lapis_segments(half_extents.y)
	var hx := half_extents.x
	var hz := half_extents.z
	var hy := half_extents.y
	for seg in segments:
		var y0: float = seg["y0"]
		var y1: float = seg["y1"]
		var c0: Color = seg["c0"]
		var c1: Color = seg["c1"]
		_add_side_quad(st, Vector3(-hx, y0, hz), Vector3(hx, y0, hz), Vector3(hx, y1, hz), Vector3(-hx, y1, hz), Vector3(0, 0, 1), c0, c1)
		_add_side_quad(st, Vector3(hx, y0, -hz), Vector3(-hx, y0, -hz), Vector3(-hx, y1, -hz), Vector3(hx, y1, -hz), Vector3(0, 0, -1), c0, c1)
		_add_side_quad(st, Vector3(hx, y0, hz), Vector3(hx, y0, -hz), Vector3(hx, y1, -hz), Vector3(hx, y1, hz), Vector3(1, 0, 0), c0, c1)
		_add_side_quad(st, Vector3(-hx, y0, -hz), Vector3(-hx, y0, hz), Vector3(-hx, y1, hz), Vector3(-hx, y1, -hz), Vector3(-1, 0, 0), c0, c1)
	var top_color: Color = LAPIS_COLORS.back()
	var bottom_color: Color = LAPIS_COLORS.front()
	_add_side_quad(st, Vector3(-hx, hy, hz), Vector3(hx, hy, hz), Vector3(hx, hy, -hz), Vector3(-hx, hy, -hz), Vector3(0, 1, 0), top_color, top_color)
	_add_side_quad(st, Vector3(-hx, -hy, -hz), Vector3(hx, -hy, -hz), Vector3(hx, -hy, hz), Vector3(-hx, -hy, hz), Vector3(0, -1, 0), bottom_color, bottom_color)

	var mesh_instance := MeshInstance3D.new()
	mesh_instance.mesh = st.commit()
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.roughness = 0.22
	material.clearcoat_enabled = true
	material.clearcoat = 0.75
	material.clearcoat_roughness = 0.15
	# Disables backface culling instead of hand-verifying winding order for
	# eight differently-oriented side faces plus two caps -- a wrong-wound
	# quad would otherwise just silently vanish rather than fail loudly.
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	mesh_instance.material_override = material
	return mesh_instance


## Splits the block's full height into LAPIS_COLORS.size() equal bands, each
## broken into a flat solid-color run plus short gradient seams shared with
## its neighbors (half the blend budget on each shared edge, so the seam
## only ever appears once between any two bands, not doubled).
func _lapis_segments(half_height: float) -> Array:
	var band_count := LAPIS_COLORS.size()
	var band_h := (half_height * 2.0) / float(band_count)
	var blend := band_h * LAPIS_BLEND_FRACTION
	var segments: Array = []
	for i in range(band_count):
		var y0 := -half_height + float(i) * band_h
		var y1 := y0 + band_h
		var color: Color = LAPIS_COLORS[i]
		var solid_y0 := y0 + (blend * 0.5 if i > 0 else 0.0)
		var solid_y1 := y1 - (blend * 0.5 if i < band_count - 1 else 0.0)
		if i > 0:
			var prev_color: Color = LAPIS_COLORS[i - 1]
			segments.append({"y0": y0 - blend * 0.5, "y1": solid_y0, "c0": prev_color, "c1": color})
		segments.append({"y0": solid_y0, "y1": solid_y1, "c0": color, "c1": color})
	return segments


func _add_side_quad(st: SurfaceTool, p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, normal: Vector3, c_bottom: Color, c_top: Color) -> void:
	st.set_normal(normal)
	st.set_color(c_bottom)
	st.add_vertex(p0)
	st.set_color(c_bottom)
	st.add_vertex(p1)
	st.set_color(c_top)
	st.add_vertex(p2)
	st.set_normal(normal)
	st.set_color(c_bottom)
	st.add_vertex(p0)
	st.set_color(c_top)
	st.add_vertex(p2)
	st.set_color(c_top)
	st.add_vertex(p3)
