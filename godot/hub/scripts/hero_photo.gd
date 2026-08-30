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

## Ordered bottom-to-top (index 0 is the bottom-most band, see
## _build_lapis()) -- per direct instruction the visible top-to-bottom order
## should read red, green, white, red, green, white, red, white, green, so
## this array is that sequence reversed.
const LAPIS_COLORS := [
	Color("2f8c46"), Color("f8f2e4"), Color("d6203a"), Color("f8f2e4"),
	Color("2f8c46"), Color("d6203a"), Color("f8f2e4"), Color("2f8c46"),
	Color("d6203a"),
]


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
	# Strafed further left again (same fixed-orientation lateral slide as
	# before, more of it), then a separate turn back toward the right --
	# re-aiming at the same target the strafe alone would otherwise have
	# left further out of frame -- brings both figures and the kueh back
	# into shot from this new, further-left vantage. Per direct instruction,
	# these are two distinct moves in sequence, not one recentered orbit.
	var strafe_left_amount := 1.2
	# Strafed upward too (fixed-orientation vertical slide, same as the
	# horizontal strafe above), with the kueh raised by the same amount so
	# it stays where it was relative to the figures instead of sinking
	# toward the bottom of frame as the camera rises above it.
	var strafe_up_amount := 0.65
	# Dollied closer to the subjects too -- translated along the fixed
	# orientation's own forward axis (basis.z is local back, so subtracting
	# it moves forward), same "translate along a fixed local axis" strafe
	# technique as the left/up moves above, just the forward axis instead.
	var dolly_in_amount := 0.5
	var camera_position := base_camera_position - camera_basis.x * strafe_left_amount + camera_basis.y * strafe_up_amount - camera_basis.z * dolly_in_amount
	# Panned up per direct instruction: the final re-aim (see the
	# strafe-then-turn comment above) now looks at a point raised above
	# base_camera_target instead of the target itself, tilting the view
	# upward rather than translating the camera.
	var pan_up_amount := 0.3
	var reframe_target := base_camera_target + Vector3(0.0, pan_up_amount, 0.0)
	var camera_basis_turned := Basis.looking_at(reframe_target - camera_position, Vector3.UP)

	# Fixed independently of wherever the camera ends up -- per direct
	# correction, the figures' own facing was tracking camera_position, so
	# every camera experiment above also re-aimed the figures at the lens
	# like a portrait instead of holding a candid pose the camera could be
	# angled around. FACING_REFERENCE_POINT stands in for "roughly toward
	# the viewer," computed once against the ORIGINAL base_camera_position,
	# not the live (now-strafed-and-turned) camera_position.
	var facing_reference := base_camera_position

	var pos_a := Vector3(-1.05, 0.0, 0.25)
	var pos_b := Vector3(-0.45, 0.0, -0.25)
	# Appearance draws stay in this exact order/count -- pos_a's figure
	# (yellow shirt) and pos_b's figure (black shirt) are identified by eye
	# from earlier renders, and any new RNG draw inserted before these two
	# calls would shift the whole seeded sequence and could hand the swatch
	# either figure currently wears to the other one. Stride-phase
	# randomization below deliberately uses its own separate RNG instead of
	# drawing from this one, for exactly that reason.
	var appearance_a := _random_appearance(rng)
	# Short ponytail restored, along with the regular rectangular glasses
	# perched on the hair instead of either kueh sunglasses style.
	appearance_a["hair_style"] = "ponytail_short"
	# One palette step lighter than the seeded appearance's original hair,
	# per direct instruction. HAIR_SWATCHES runs dark-to-light.
	var yellow_hair_index := 0
	for i in range(CharacterEditor.HAIR_SWATCHES.size()):
		if Color(CharacterEditor.HAIR_SWATCHES[i]).is_equal_approx(appearance_a["hair"]):
			yellow_hair_index = i
			break
	appearance_a["hair"] = Color(CharacterEditor.HAIR_SWATCHES[mini(
		CharacterEditor.HAIR_SWATCHES.size() - 1, yellow_hair_index + 1
	)])
	appearance_a["glasses"] = true
	appearance_a["round_glasses"] = false
	appearance_a["glasses_on_hair"] = true
	appearance_a["lapis_glasses"] = false
	appearance_a["salat_glasses"] = false
	var figure_a := FigureBuilder.build(world, appearance_a)

	var appearance_b := _random_appearance(rng)
	# Dark hair -- one shade lighter than the darkest swatch now, per direct
	# follow-up instruction -- and one skin shade lighter, for the
	# black-shirt figure. Both SKIN_SWATCHES and HAIR_SWATCHES run
	# light-to-dark, so "lighter" is one index toward the front.
	appearance_b["hair"] = Color(CharacterEditor.HAIR_SWATCHES[1])
	var current_skin_index := 0
	for i in range(CharacterEditor.SKIN_SWATCHES.size()):
		if Color(CharacterEditor.SKIN_SWATCHES[i]).is_equal_approx(appearance_b["skin"]):
			current_skin_index = i
			break
	appearance_b["skin"] = Color(CharacterEditor.SKIN_SWATCHES[maxi(0, current_skin_index - 1)])
	# Kueh Lapis glasses on the black-shirt figure.
	appearance_b["lapis_glasses"] = true
	appearance_b["salat_glasses"] = false
	var figure_b := FigureBuilder.build(world, appearance_b)

	# Independently randomized per figure (separate RNG/seed from the
	# appearance draws above) so the two figures' stride phases don't land
	# in sync -- per direct instruction. Each is pinned near +-90 degrees
	# (sin near +-1) so both read as a clear mid-stride rather than risking
	# a near-zero swing that looks like standing still.
	var pose_rng := RandomNumberGenerator.new()
	pose_rng.seed = APPEARANCE_SEED + 1
	var phase_a := (PI * 0.5) * (1.0 if pose_rng.randf() < 0.5 else -1.0) + pose_rng.randf_range(-0.5, 0.5)
	var phase_b := (PI * 0.5) * (1.0 if pose_rng.randf() < 0.5 else -1.0) + pose_rng.randf_range(-0.5, 0.5)
	# The yellow-shirt figure (figure_a) pushed 10% of a full stride cycle
	# further along, per direct instruction.
	phase_a += TAU * 0.1

	# Both bodies now aim the same direction (same atan2(dx,dz)
	# toward-a-point formula hub_npc.gd's own setup() already uses to aim a
	# figure inward, computed once from the pair's own midpoint rather than
	# separately per figure) -- walking side by side rather than angled
	# toward one another, per direct instruction. The individual +-18/20
	# degree body turns that used to sell "facing each other" are gone; the
	# conversational read now lives entirely in the head_yaw below, which
	# still turns each head toward the other figure while the bodies stay
	# parallel -- how two people actually walk and talk side by side.
	var shared_body_yaw := _yaw_toward((pos_a + pos_b) * 0.5, facing_reference)
	_pose_talking_stride(figure_a, -1, pos_a, shared_body_yaw, 0.5, phase_a)
	_pose_talking_stride(figure_b, 1, pos_b, shared_body_yaw, -0.45, phase_b)

	# Depth (local Z) pushed well past width (local X) per direct
	# instruction -- more than double it, a genuine log/prism proportion
	# rather than a slab, so the box reads as three-dimensional from a much
	# wider range of camera angles instead of needing one exact azimuth to
	# reveal any depth at all.
	var lapis := _build_lapis(Vector3(0.21, 0.47, 0.55))
	# Raised by strafe_up_amount to stay put relative to the figures as the
	# camera rises above it, then lowered 16cm total (5cm, 5cm, then 6cm)
	# per direct instruction; rotation is Y-only now (was X/Z-tilted too) so
	# it stands straight up and down, per direct instruction.
	lapis.position = Vector3(0.65, 1.35 + strafe_up_amount - 0.16, 0.35)
	lapis.rotation_degrees = Vector3(0.0, -38.0, 0.0)
	world.add_child(lapis)

	var camera := Camera3D.new()
	camera.fov = 42.0
	camera.transform = Transform3D(camera_basis_turned, camera_position)
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
## soft secondary + cool rim, pure-white ACES-toned background) so the hero
## photo and the Hub it links into read as one continuous lighting world
## rather than two different renders stitched together.
## Golden hour per direct instruction -- replaces the Hub's own neutral
## off-white/cool-fill recipe (this scene no longer needs to match the
## in-game lighting exactly; the hero photo can have its own mood). A low
## warm key (the setting sun itself), a cool complementary shadow-fill
## (the sky's own blue showing through where the sun doesn't reach -- the
## classic golden-hour look comes from that warm/cool contrast, not just
## an orange key on its own), and a warm rim standing in for the sun's own
## glow along edges facing away from it. Background kept white/neutral per
## direct instruction (reverted from an earlier warm-gold attempt) -- the
## golden-hour mood lives entirely in the lights and the ambient tint below.
func _build_environment(viewport: SubViewport) -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color.WHITE
	environment.background_energy_multiplier = 1.0
	environment.tonemap_mode = Environment.TONE_MAPPER_ACES
	environment.tonemap_exposure = 0.92
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("f5e2c4")
	environment.ambient_light_energy = 0.22
	environment.ambient_light_sky_contribution = 0.0
	# Keep the baked landing image crisp. Glow spreads bright material and
	# lighting values outside every silhouette in the compatibility renderer,
	# producing a white cut-out halo around figures and props.
	environment.glow_enabled = false
	environment.fog_enabled = false
	world_environment.environment = environment
	viewport.add_child(world_environment)

	# The sun itself, low on the horizon (a golden hour's defining trait --
	# a steep angle like the old -52 degree key reads as midday). Color
	# pulled back toward a lighter, less saturated gold per direct
	# correction (was reading as too tinted overall) -- still clearly warm,
	# just not a full orange wash.
	var key_light := DirectionalLight3D.new()
	key_light.rotation_degrees = Vector3(-16, -50, 0)
	key_light.light_color = Color("ffb578")
	key_light.light_energy = 0.85
	key_light.light_angular_distance = 3.5
	viewport.add_child(key_light)

	# Cool blue-lavender shadow-fill -- the sky's own light, not the sun's --
	# is what actually makes golden hour read as golden hour; without a
	# cool counterpoint the warm key alone just looks like an orange filter.
	var secondary_light := DirectionalLight3D.new()
	secondary_light.rotation_degrees = Vector3(-38, 82, 0)
	secondary_light.light_color = Color("8fa3d1")
	secondary_light.light_energy = 0.16
	secondary_light.light_angular_distance = 5.0
	viewport.add_child(secondary_light)

	# Warm rim standing in for the low sun's own glow along edges facing
	# away from the key.
	var rim_light := DirectionalLight3D.new()
	rim_light.rotation_degrees = Vector3(-22, 142, 0)
	rim_light.light_color = Color("ffdcae")
	rim_light.light_energy = 0.20
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
func _pose_talking_stride(figure: Dictionary, side: int, world_position: Vector3, facing_yaw: float, head_yaw: float, stride_phase: float) -> void:
	var root := figure["root"] as Node3D
	root.position = world_position
	root.rotation.y = facing_yaw

	# stride_phase is independently randomized per figure (see _run()) so
	# the two gaits aren't locked to a shared mirror of one another; `side`
	# below is used only to pick which arm gestures, not the leg phase.
	var swing := sin(stride_phase) * 0.42
	(figure["leg_left"] as Node3D).rotation.x = swing
	(figure["leg_right"] as Node3D).rotation.x = -swing
	# The trailing leg (the one swung backward) is the one that bends at the
	# knee mid-stride; the leading leg stays nearly straight -- derived from
	# this figure's own swing direction now, not the shared `side` value.
	var bent_knee: Node3D = figure["knee_right"] if swing > 0.0 else figure["knee_left"]
	var straight_knee: Node3D = figure["knee_left"] if swing > 0.0 else figure["knee_right"]
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


## Per direct correction, a hand-rolled SurfaceTool box was never going to
## read as a real 3D solid the way this project's own signature primitive
## does -- every other object in this scene (every part of both figures) is
## a SuperEgg, so the kueh is now nine of them too: one thin superegg per
## color band, stacked flush with no gap. That directly gives "very tight
## transitions between layers" as a hard seam between two solid-color
## parts (closer to how a real cut kueh lapis actually looks than a
## deliberately blended gradient was), reuses SuperEgg.build_part()'s own
## proven-correct generated normals and material recipe (the same one every
## correctly-lit figure part in this render already uses) instead of
## hand-derived face normals, and needs no defensive CULL_DISABLED. `epsilon`
## very high (see super_egg.gd's own doc comment: higher = boxier, flatter
## faces) for "very minimal rounding" per direct instruction, applied
## uniformly so every edge -- top, bottom, and the vertical corners -- gets
## the same slight softening rather than a stack-seam-specific flat epsilon.
## `half_extents` is (half-width X, half-height Y, half-depth Z).
func _build_lapis(half_extents: Vector3) -> Node3D:
	const EPSILON_MINIMAL := 9.0
	var container := Node3D.new()
	var band_count := LAPIS_COLORS.size()
	var segment_height := (half_extents.y * 2.0) / float(band_count)
	var segment_half_height := segment_height * 0.5
	# Compressed into each other by ~2cm per layer now (1cm, then another
	# 1cm), per direct instruction -- each segment keeps its own full height
	# (so it still overlaps its neighbor rather than shrinking), only the
	# center-to-center spacing between successive layers is reduced, fusing
	# them tighter together.
	var layer_compression := 0.02
	for i in range(band_count):
		var segment := SuperEgg.build_part(
			Vector3(half_extents.x, segment_half_height, half_extents.z),
			LAPIS_COLORS[i], EPSILON_MINIMAL, EPSILON_MINIMAL
		)
		segment.position.y = -half_extents.y + segment_half_height + float(i) * (segment_height - layer_compression)
		# A bit shinier than the figures' own default 0.6, per earlier direct
		# instruction -- moderate, no clearcoat, so it stays the same
		# well-lit material family instead of reintroducing the risk that
		# caused the darkness in the hand-rolled version.
		var material := segment.get_surface_override_material(0) as StandardMaterial3D
		material.roughness = 0.45
		# A hint of transparency, per direct instruction -- reduced from an
		# earlier 5% down to 2%.
		material.albedo_color.a = 0.98
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		container.add_child(segment)
	return container
