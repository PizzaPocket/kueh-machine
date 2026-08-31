extends Node3D

const INTERACT_DISTANCE := 3.2
# CharacterEditor's own Height options -- Less tall / Tall / More tall.
const HEIGHT_LESS_TALL := 0.94
const HEIGHT_TALL := 1.0
const HEIGHT_MORE_TALL := 1.06
const KUEH_WORDMARK_MESH: Mesh = preload("res://assets/wordmark/kueh_syne_800.obj")
const MACHINE_WORDMARK_MESH: Mesh = preload("res://assets/wordmark/machine_syne_600.obj")
## Azri's own entry dropped per direct instruction -- his line now falls
## straight through to the same ambient, non-modal auto-dismiss every
## ambient_npc already uses (see _talk_to_nearby(): an empty actions array
## sets _ambient_dialog_active instead of locking player input for a
## response). Each remaining entry is a list, not a single string -- Kevin's
## own single response left him with exactly one option and nothing else,
## which per direct correction should never happen (a conversation should
## always give the player somewhere to go); his second entry is the German
## equivalent of "Later."
const PLAYER_RESPONSES := {
	"Kevin Dreher": ["Schön, dich zu besuchen!", "Bis später!"],
}
const CONTRIBUTOR_KEYS := {
	"Amanda Ng": "amanda", "Amy Fu": "amy", "Azri": "azri",
	"Geraldine Chua": "geraldine", "Jesslyn Teo": "jesslyn",
	"Kaixin Cai": "kaixin", "Ken Lee": "ken", "Kevin Dreher": "kevin",
	"Leonard Reese": "leonard", "Li Wei Lim": "liwei", "Mei Jun Chew": "meijun",
	"Natalia Lionardy": "natalia", "Nicole Ng": "nicole",
	"Ruth Yong": "ruth", "Samantha Tan": "samantha",
	"Sophia Himawan": "sophia", "Viki Yap": "viki",
}

var _player: HubPlayer
var _ui: HubUI
var _npcs: Array[HubNPC] = []
var _interactables: Array[Dictionary] = []
var _nearby: Node3D
var _nearby_data: Dictionary = {}
var _nearby_prompt := "Talk (F)"
var _nearby_kind := "npc"
var _ambient_dialog_active := false
var _street_data: Dictionary = {}
var _logo: Node3D
var _logo_origin_y := 0.0
var _elapsed := 0.0
var _account_appearance: Dictionary = {}
var _signed_in := false
var _owned_contributor_key := ""
var _remote_appearances: Dictionary = {}
var _character_editor: CharacterEditor
var _editor_input_mode_active := false
var _previous_emulate_mouse_from_touch := false
var _previous_emulate_touch_from_mouse := false

func _ready() -> void:
	_load_character_bootstrap()
	if not _signed_in and _account_appearance.is_empty():
		_account_appearance = _random_player_appearance()
	_setup_input()
	_build_environment()
	_street_data = ShophouseStreet.build(self)
	_player = HubPlayer.new()
	_player.appearance_override = _account_appearance
	_player.position = Vector3(0, 0.22, 15)
	add_child(_player)
	_player.interact_requested.connect(_talk_to_nearby)
	_build_contributors()
	_build_sophia_cats()
	_register_amanda_door()
	_ui = HubUI.new()
	add_child(_ui)
	_player.input_locked = false

func _process(_delta: float) -> void:
	_update_nearby()
	_poll_character_editor_request()

func _poll_character_editor_request() -> void:
	if _character_editor != null or not OS.has_feature("web"):
		return
	var window := JavaScriptBridge.get_interface("window")
	if window != null and bool(window.consumeKuehCharacterEditorRequest()):
		_open_character_editor()

func _open_character_editor() -> void:
	# Authentication can change while the Web export remains running. Refresh
	# the browser bridge here instead of relying on the startup-only bootstrap,
	# otherwise an in-place login leaves the editor holding the signed-out
	# visitor's random appearance until the entire page is reloaded.
	_load_character_bootstrap()
	_enter_character_editor_input_mode()
	_player.input_locked = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_ui.set_prompt(false)
	_character_editor = CharacterEditor.new()
	_character_editor.setup(_editor_initial_appearance(), _owned_contributor_key)
	_character_editor.appearance_saved.connect(_apply_saved_appearance)
	_character_editor.closed.connect(_close_character_editor)
	_character_editor.tree_exited.connect(_restore_character_editor_input_mode)
	add_child(_character_editor)

func _enter_character_editor_input_mode() -> void:
	if _editor_input_mode_active:
		return
	_editor_input_mode_active = true
	_ui.set_input_enabled(false)
	if OS.has_feature("web"):
		_previous_emulate_mouse_from_touch = Input.emulate_mouse_from_touch
		_previous_emulate_touch_from_mouse = Input.emulate_touch_from_mouse
		# Godot's Web GUI needs physical touch translated onto its mouse-driven
		# Control path. Keep the reverse translation off: enabling both directions
		# represents one finger twice and exaggerates ScrollContainer movement.
		Input.emulate_mouse_from_touch = true
		Input.emulate_touch_from_mouse = false

func _restore_character_editor_input_mode() -> void:
	if not _editor_input_mode_active:
		return
	_editor_input_mode_active = false
	if OS.has_feature("web"):
		Input.emulate_mouse_from_touch = _previous_emulate_mouse_from_touch
		Input.emulate_touch_from_mouse = _previous_emulate_touch_from_mouse
	if is_instance_valid(_ui):
		_ui.set_input_enabled(true)

func _apply_saved_appearance(saved_appearance: Dictionary) -> void:
	_account_appearance = saved_appearance.duplicate(true)
	_player.apply_appearance(_account_appearance)
	if _owned_contributor_key.is_empty():
		return
	for npc in _npcs:
		var npc_key: String = CONTRIBUTOR_KEYS.get(npc.contributor.get("name", ""), "")
		if npc_key == _owned_contributor_key:
			npc.apply_appearance(_account_appearance)

func _close_character_editor() -> void:
	_character_editor = null
	_restore_character_editor_input_mode()
	_player.input_locked = false

func _editor_initial_appearance() -> Dictionary:
	if not _account_appearance.is_empty():
		return _account_appearance.duplicate(true)
	if not _owned_contributor_key.is_empty():
		for contributor in _contributors():
			if CONTRIBUTOR_KEYS.get(contributor["name"], "") == _owned_contributor_key:
				return (contributor["appearance"] as Dictionary).duplicate(true)
	return {}

func _setup_input() -> void:
	_add_key_action("move_forward", KEY_W)
	_add_key_action("move_back", KEY_S)
	_add_key_action("move_left", KEY_A)
	_add_key_action("move_right", KEY_D)
	_add_key_action("jump", KEY_SPACE)
	_add_key_action("run", KEY_SHIFT)
	_add_key_action("interact", KEY_F)
	_add_joy_action("look_left", JOY_AXIS_RIGHT_X, -1.0)
	_add_joy_action("look_right", JOY_AXIS_RIGHT_X, 1.0)
	_add_joy_action("look_up", JOY_AXIS_RIGHT_Y, -1.0)
	_add_joy_action("look_down", JOY_AXIS_RIGHT_Y, 1.0)

func _add_key_action(action: StringName, keycode: Key) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	InputMap.action_add_event(action, event)

func _add_joy_action(action: StringName, axis: JoyAxis, value: float) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, 0.18)
	var event := InputEventJoypadMotion.new()
	event.axis = axis
	event.axis_value = value
	InputMap.action_add_event(action, event)

func _build_environment() -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color.WHITE
	# Keep the void neutral white. ACES still compresses bright shoulders on
	# scene geometry so this does not restore the former silhouette blowout.
	environment.background_energy_multiplier = 1.0
	environment.tonemap_mode = Environment.TONE_MAPPER_ACES
	environment.tonemap_exposure = 0.86
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	# A restrained, slightly cool fill gives the unlit sides readable form
	# without flattening every material to white.
	environment.ambient_light_color = Color("e8edf2")
	environment.ambient_light_energy = 0.18
	environment.ambient_light_sky_contribution = 0.0
	# Keep silhouettes crisp against the bright sky. Even with glow_bloom at
	# zero, the compatibility renderer spreads HDR-bright edges when the camera
	# tilts upward -- the same failure mode removed from the hero capture.
	# Authored signs retain their bright material values, just without a halo.
	environment.glow_enabled = false
	# White fog was adding energy across the whole frame and destroying
	# silhouettes. The white plane/background already provide the void.
	environment.fog_enabled = false
	world_environment.environment = environment
	add_child(world_environment)
	# One broad warm key establishes direction and soft contact shadows.
	var key_light := DirectionalLight3D.new()
	key_light.name = "WarmKeyLight"
	key_light.rotation_degrees = Vector3(-52, -38, 0)
	key_light.light_color = Color("fff1df")
	key_light.light_energy = 0.38
	key_light.light_angular_distance = 3.5
	key_light.shadow_enabled = true
	key_light.directional_shadow_max_distance = 55.0
	add_child(key_light)
	# A soft secondary source sits about 120 degrees around the room from the
	# key (-38 + 120 = 82 degrees). It opens the key's shadow side without
	# competing with its direction or stacking another set of hard shadows.
	var secondary_light := DirectionalLight3D.new()
	secondary_light.name = "SoftSecondaryLight"
	secondary_light.rotation_degrees = Vector3(-38, 82, 0)
	secondary_light.light_color = Color("edf3f7")
	secondary_light.light_energy = 0.13
	secondary_light.light_angular_distance = 5.0
	secondary_light.shadow_enabled = false
	add_child(secondary_light)
	# A very low-energy cool rim separates figures from the white void. It is
	# intentionally shadowless so it behaves as fill, not a second sun.
	var rim_light := DirectionalLight3D.new()
	rim_light.name = "CoolRimLight"
	rim_light.rotation_degrees = Vector3(-28, 142, 0)
	rim_light.light_color = Color("dce9f5")
	rim_light.light_energy = 0.08
	rim_light.shadow_enabled = false
	add_child(rim_light)
	var floor := StaticBody3D.new()
	floor.name = "EndlessWhiteFloor"
	floor.collision_layer = 1
	add_child(floor)
	var floor_mesh := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(1000, 1000)
	floor_mesh.mesh = plane
	floor_mesh.material_override = HubPalette.material(HubPalette.WHITE, 0.0, 0.86)
	floor.add_child(floor_mesh)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(1000, 0.2, 1000)
	collision.shape = shape
	collision.position.y = -0.1
	floor.add_child(collision)

func _build_logo() -> void:
	_logo = Node3D.new()
	_logo.name = "FloatingKuehMachineLogo"
	_logo.position = Vector3(0, 7.6, 14.0)
	_logo.rotation.y = PI
	_logo_origin_y = _logo.position.y
	add_child(_logo)
	# These are the homepage wordmark's real Syne outlines: 800 for Kueh,
	# 600 for Machine, title case, with the same tight display tracking.
	var kueh_width := KUEH_WORDMARK_MESH.get_aabb().size.x
	var machine_width := MACHINE_WORDMARK_MESH.get_aabb().size.x
	var gap := 0.30
	var full_width := kueh_width + gap + machine_width
	var start_x := -full_width * 0.5
	_add_vector_word("Kueh", KUEH_WORDMARK_MESH, Vector3(start_x + kueh_width * 0.5, 0, 0), true)
	_add_vector_word("Machine", MACHINE_WORDMARK_MESH, Vector3(start_x + kueh_width + gap + machine_width * 0.5, 0, 0), false)

func _add_vector_word(text: String, word_mesh: Mesh, position: Vector3, is_kueh: bool) -> void:
	var word := Node3D.new()
	word.name = text + "VectorWord"
	word.position = position
	_logo.add_child(word)
	# Several progressively emboldened copies of the same outlines form a
	# smooth, shallow bevel. This mirrors the homepage's nested vector rims
	# while rounding the silhouette instead of leaving a knife-edge extrusion.
	var bevel_steps := 5
	for step in range(bevel_steps):
		var t := float(step) / float(bevel_steps - 1)
		var embolden := lerpf(5.0, 0.7, t)
		var depth := lerpf(0.38, 0.245, t)
		var rim_color: Color
		if is_kueh:
			rim_color = HubPalette.PINK_DARK.lerp(HubPalette.PINK, t * 0.72)
		else:
			rim_color = HubPalette.PINK_DARK.lerp(HubPalette.METAL_LIGHT, smoothstep(0.2, 1.0, t))
		_add_word_layer(word, word_mesh, embolden, depth, -0.035 + t * 0.012, rim_color, true, false)
	_add_word_layer(word, word_mesh, 0.0, 0.22, 0.012, Color.WHITE, false, is_kueh)

func _add_word_layer(parent: Node3D, word_mesh: Mesh, embolden: float, depth: float, z: float, color: Color, metallic: bool, striped: bool) -> void:
	var node := MeshInstance3D.new()
	node.mesh = word_mesh
	# Scaling the original outline by only a few percent avoids modifying the
	# font contours themselves (which can introduce self-intersections), while
	# the depth progression rounds the front edge into the nested rim.
	var rim_scale := 1.0 + embolden * 0.009
	node.scale = Vector3(rim_scale, rim_scale, depth / 0.22)
	node.position.z = z
	if striped:
		node.material_override = _kueh_stripe_material()
	elif metallic:
		node.material_override = HubPalette.material(color, 0.72, 0.24)
	else:
		node.material_override = _machine_sheen_material()
	parent.add_child(node)

func _kueh_stripe_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
varying float glyph_y;
void vertex() { glyph_y = VERTEX.y; }
void fragment() {
	float y = clamp(glyph_y / 1.65 + 0.48, 0.0, 1.0);
	vec3 pink_dark = vec3(0.72, 0.18, 0.41);
	vec3 pink = vec3(0.91, 0.38, 0.60);
	vec3 gold = vec3(0.97, 0.84, 0.45);
	vec3 green = vec3(0.56, 0.80, 0.37);
	vec3 cream = vec3(1.0, 0.96, 0.89);
	vec3 c = mix(pink_dark, pink, smoothstep(0.17, 0.20, y));
	c = mix(c, gold, smoothstep(0.37, 0.40, y));
	c = mix(c, cream, smoothstep(0.52, 0.55, y));
	c = mix(c, green, smoothstep(0.68, 0.71, y));
	c = mix(c, pink, smoothstep(0.84, 0.87, y));
	ALBEDO = c;
	ROUGHNESS = 0.46;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material

func _machine_sheen_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
varying float glyph_y;
void vertex() { glyph_y = VERTEX.y; }
void fragment() {
	float y = clamp(glyph_y / 1.65 + 0.5, 0.0, 1.0);
	float brushed = 0.58 + 0.26 * sin(y * 44.0) + 0.10 * sin(y * 113.0);
	vec3 cool = vec3(0.58, 0.64, 0.69);
	vec3 warm = vec3(0.88, 0.84, 0.78);
	ALBEDO = mix(cool, warm, clamp(brushed, 0.0, 1.0));
	METALLIC = 0.78;
	ROUGHNESS = 0.24;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material

func _build_contributors() -> void:
	for data in _contributors():
		var contributor_key: String = CONTRIBUTOR_KEYS.get(data["name"], "")
		# Keep the owner's contributor NPC in-world as a deliberate doppelgänger
		# easter egg. Only that signed-in owner receives the alternate dialogue
		# name; everyone else continues to see the contributor normally.
		data["is_owner_doppelganger"] = not contributor_key.is_empty() and contributor_key == _owned_contributor_key
		if _remote_appearances.has(contributor_key):
			var remote: Dictionary = _normalize_appearance(_remote_appearances[contributor_key])
			if not remote.is_empty():
				var appearance: Dictionary = data["appearance"]
				# Optional visual treatments encode "off" by being absent from the
				# saved profile. Remove bundled contributor defaults before merging,
				# otherwise Kaixin selecting a normal top cannot clear her original
				# Kara-o-kueh pattern when the persistent NPC is reconstructed.
				for optional_key in ["shirt_pattern", "shirt_texture"]:
					if not remote.has(optional_key):
						appearance.erase(optional_key)
				appearance.merge(remote, true)
		var npc_position: Vector3 = data["position"]
		var display_kind: String = data.get("display", "")
		if not display_kind.is_empty():
			var display_position: Vector3 = data["display_position"]
			var inward: Vector3 = Vector3(0, 0, 1)
			var display := DisplayBuilder.build(self, display_kind, display_position)
			display.rotation.y = data.get("display_facing", atan2(inward.x, inward.z))
			if data["name"] in ["Amy Fu", "Ken Lee"]:
				ShophouseStreet.add_pole_support(display)
			if data["name"] == "Samantha Tan":
				ShophouseStreet.add_boombox_table(display)
			if data["name"] == "Amanda Ng":
				ShophouseStreet.add_beary_chair(display)
			if data["name"] in ["Amy Fu", "Ken Lee", "Kaixin Cai", "Li Wei Lim", "Ruth Yong", "Samantha Tan"]:
				var display_data := _hotspot_data(data, data.get("display_title", data["name"]), data.get("display_dialog", data["dialog"]))
				_register_interactable(display, display_data, "View (F)", "display")
			# Place the presenter beside—not behind—their display. There are two
			# valid lateral sides; retain whichever one is nearest their authored
			# layout position so the room's grouping stays intentional. A 1.12 m
			# centre offset keeps figures visually close while clearing the widest
			# cabinet casing and the figure's relaxed stance.
			if not bool(data.get("fixed_npc_position", false)):
				var lateral := Vector3(inward.z, 0, -inward.x)
				var side_a := display_position + lateral * 1.12
				var side_b := display_position - lateral * 1.12
				var authored_position: Vector3 = data["position"]
				npc_position = side_a if side_a.distance_squared_to(authored_position) <= side_b.distance_squared_to(authored_position) else side_b
		var venue_center := _indoor_venue_center(String(data["name"]))
		if data.has("npc_facing"):
			data["facing"] = data["npc_facing"]
		elif venue_center != Vector3.INF:
			var toward_center := venue_center - npc_position
			data["facing"] = atan2(toward_center.x, toward_center.z)
		var npc: HubNPC
		if bool(data.get("roaming", false)):
			var roaming_npc := HubRoamingNPC.new()
			roaming_npc.position = npc_position
			add_child(roaming_npc)
			roaming_npc.setup_roaming(data, _player, data.get("roam_bounds", [Rect2(-14, 7, 28, 7)]), data.get("door_waypoints", []))
			npc = roaming_npc
		else:
			npc = HubNPC.new()
			npc.position = npc_position
			add_child(npc)
			npc.setup(data, _player)
		_npcs.append(npc)
		_register_interactable(npc, data, "Talk (F)", "ambient_npc" if bool(data.get("ambient_dialog", false)) else "npc")

func _load_character_bootstrap() -> void:
	if not OS.has_feature("web"):
		return
	var window := JavaScriptBridge.get_interface("window")
	if window == null or not bool(window.hasOwnProperty("getKuehCharacterBootstrapJson")):
		return
	var parsed: Variant = JSON.parse_string(str(window.getKuehCharacterBootstrapJson()))
	if not (parsed is Dictionary):
		return
	_signed_in = not str(parsed.get("userId", "")).is_empty()
	_owned_contributor_key = str(parsed.get("ownedContributorKey", ""))
	_account_appearance = _normalize_appearance(parsed.get("appearance", {}))
	for item in parsed.get("contributors", []):
		if item is Dictionary and not str(item.get("key", "")).is_empty():
			_remote_appearances[str(item["key"])] = item.get("appearance", {})

func _normalize_appearance(value: Variant) -> Dictionary:
	if not (value is Dictionary):
		return {}
	var result: Dictionary = (value as Dictionary).duplicate(true)
	for key in ["skin", "hair", "top", "bottom", "shoes"]:
		if result.get(key) is String and Color.html_is_valid(result[key]):
			result[key] = Color.from_string(str(result[key]), Color.WHITE)
	return result

func _build_sophia_cats() -> void:
	var sophia_data := _contributor_named("Sophia Himawan")
	var cat_data := _hotspot_data(
		sophia_data,
		"Cat Scan",
		"A neighborhood cat pauses just long enough to be noticed. Sophia's project helps you find more feline neighbors."
	)
	var first := HubCat.new()
	first.name = "SophiasRoamingCatA"
	first.coat_color = CatFigure.COAT_COLORS[1]
	first.position = Vector3(-11.0, 0, 10.2)
	add_child(first)
	_register_interactable(first, cat_data, "Look at cat (F)", "display")
	var second := HubCat.new()
	second.name = "SophiasRoamingCatB"
	second.coat_color = CatFigure.COAT_COLORS[3]
	second.position = Vector3(9.0, 0, 11.5)
	add_child(second)
	_register_interactable(second, cat_data, "Look at cat (F)", "display")
	var third := HubCat.new()
	third.name = "SophiasRoamingCatC"
	third.coat_color = CatFigure.COAT_COLORS[0]
	third.position = Vector3(0.5, 0, 10.5)
	add_child(third)
	_register_interactable(third, cat_data, "Look at cat (F)", "display")

func _register_amanda_door() -> void:
	var door := _street_data.get("amanda_door") as Node3D
	if door != null:
		var door_data := _hotspot_data(
			_contributor_named("Amanda Ng"),
			"Beary's Kueh Shop",
			"A cozy cafe story about helping lost Kueh piece their memories together, one sweet story at a time."
		)
		_register_interactable(door, door_data, "Visit Beary's (F)", "display")

func _hotspot_data(source: Dictionary, title: String, line: String) -> Dictionary:
	var result := source.duplicate(true)
	result["name"] = title
	result["dialog"] = line
	result["is_owner_doppelganger"] = false
	return result

func _register_interactable(node: Node3D, data: Dictionary, prompt := "Talk (F)", interaction_kind := "npc") -> void:
	if node == null or data.is_empty():
		return
	_interactables.append({"node": node, "data": data, "prompt": prompt, "kind": interaction_kind})

func _contributor_named(contributor_name: String) -> Dictionary:
	for data in _contributors():
		if data["name"] == contributor_name:
			return data
	return {}

## 0 = pure nearest-distance picking, 1 = strongly favors whatever the
## player's body is currently facing over something merely closer.
const FACING_BIAS_STRENGTH := 0.6

func _update_nearby() -> void:
	if _player == null or _ui == null or _player.input_locked:
		return
	if _ambient_dialog_active:
		_ui.set_prompt(false)
		return
	var closest: Node3D = null
	var closest_data: Dictionary = {}
	var closest_prompt := "Talk (F)"
	var closest_kind := "npc"
	var best_score := INF
	var body_forward := _player.body_forward()
	var space_state := get_world_3d().direct_space_state
	for item in _interactables:
		var node := item.get("node") as Node3D
		if node == null or not is_instance_valid(node):
			continue
		var offset := node.global_position - _player.global_position
		var distance := offset.length()
		if distance >= INTERACT_DISTANCE:
			continue
		# A crowd of interactables within range shouldn't force picking
		# whichever happens to be a few centimeters closer -- bias the score
		# toward whatever the player's body is actually facing. Alignment
		# runs -1 (behind) to 1 (straight ahead), so this shrinks the
		# effective distance to things in front and grows it for things
		# behind, while the raw distance above still gates what's in range
		# at all.
		var alignment := 0.0
		var horizontal := Vector2(offset.x, offset.z)
		if horizontal.length() > 0.01:
			alignment = body_forward.dot(Vector3(horizontal.x, 0.0, horizontal.y).normalized())
		var score := distance * (1.0 - FACING_BIAS_STRENGTH * alignment)
		if score >= best_score:
			continue
		# Straight-line distance alone doesn't know about walls -- standing
		# in the gallery facing the arcade's shared wall used to offer
		# whatever NPC/cabinet sat just past it, closer in a straight line
		# than anything actually reachable. Only cast this ray for whatever
		# would otherwise win (not every candidate every frame): if it's
		# blocked, leave the previous best in place instead of promoting a
		# now-invalid one, so a farther-but-visible item can still be picked
		# up on a later iteration.
		var eye_height := Vector3.UP * 1.3
		var query := PhysicsRayQueryParameters3D.create(_player.global_position + eye_height, node.global_position + eye_height, 1)
		query.exclude = [_player]
		var hit := space_state.intersect_ray(query)
		# NPCs (hub_npc.gd's own StaticBody3D) and some other interactables
		# carry their own collider as a child of the registered node itself
		# -- the ray reaching THAT is arriving at the target, not being
		# blocked by something else, so only a hit outside the target's own
		# hierarchy counts as an obstruction.
		if not hit.is_empty() and not node.is_ancestor_of(hit.get("collider")):
			continue
		closest = node
		closest_data = item.get("data", {})
		closest_prompt = item.get("prompt", "Talk (F)")
		closest_kind = item.get("kind", "npc")
		best_score = score
	_nearby = closest
	_nearby_data = closest_data
	_nearby_prompt = closest_prompt
	_nearby_kind = closest_kind
	_ui.set_prompt(_nearby != null, _nearby_prompt)

func _talk_to_nearby() -> void:
	if _nearby == null or _ambient_dialog_active:
		return
	_ui.set_prompt(false)
	var data := _nearby_data
	var actions: Array[Dictionary] = []
	var url: String = data.get("url", "")
	# "View project" (no trailing period) is the one uniform label for a
	# project link now, per direct instruction -- display-kind interactions
	# (Li Wei's Lapis cabinet, etc) and an ordinary contributor NPC's own
	# project link used three different labels between them ("Visit
	# project", "Visit project.", Nicole Ng's own "View project." special
	# case) for what's the same action everywhere.
	if _nearby_kind == "display" and not url.is_empty():
		actions.append({
			"label": "View project",
			"callback": func() -> void:
				DialogUI.hide_dialog()
				_visit_project(url)
				_on_dialog_closed()
		})
	elif _nearby_kind != "ambient_npc":
		var player_responses: Array = PLAYER_RESPONSES.get(data["name"], [])
		for player_response in player_responses:
			actions.append({
				"label": player_response,
				"callback": func() -> void:
					DialogUI.hide_dialog()
					_on_dialog_closed()
			})
		if not url.is_empty():
			actions.append({
				"label": "View project",
				"callback": func() -> void:
					DialogUI.hide_dialog()
					_visit_project(url)
					_on_dialog_closed()
			})
	if _nearby_kind == "ambient_npc" and _nearby is HubRoamingNPC:
		(_nearby as HubRoamingNPC).pause_for_interaction()
	# "Later" pairs with "View project" above for anyone presenting a
	# project (display-kind, or an ordinary NPC whose own url is set) --
	# replaces "display" kind's separate "Back" per direct instruction, so
	# both read as the same pair of options everywhere a project link
	# shows up. ambient_npc/PLAYER_RESPONSES cases still add no extra
	# dismiss action of their own (empty string) -- their own response(s)
	# already are the full set of options. Everything else (plain chatter
	# with neither a url nor a scripted response) keeps "Goodbye."
	var dismiss_label: String
	if _nearby_kind == "ambient_npc" or PLAYER_RESPONSES.has(data["name"]):
		dismiss_label = ""
	elif _nearby_kind == "display" or not url.is_empty():
		dismiss_label = "Later"
	else:
		dismiss_label = "Goodbye."
	var speaker_name := "Mirror Universe You" if bool(data.get("is_owner_doppelganger", false)) else String(data["name"])
	# Modal response choices own player input; ambient Eleblorb-style chatter is
	# purely informational and remains on screen while traversal continues.
	if actions.is_empty():
		_ambient_dialog_active = true
	else:
		_player.input_locked = true
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	DialogUI.show_line(speaker_name, data["dialog"], actions, dismiss_label, _on_dialog_closed)

func _on_dialog_closed() -> void:
	_ambient_dialog_active = false
	_player.input_locked = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _visit_project(url: String) -> void:
	if OS.has_feature("web"):
		var window := JavaScriptBridge.get_interface("window")
		# Contributor projects are destinations branching out from the shared
		# Kueh-verse. Keep the world alive in its current tab so visitors can
		# return without downloading and initializing the Godot scene again.
		window.open(url, "_blank", "noopener,noreferrer")
	else:
		OS.shell_open(url)

func _contributors() -> Array[Dictionary]:
	# Every link below is the pretty "/<slug>/" route, never "/machines/
	# <slug>/" — the latter is just the raw filesystem path, and only
	# happens to also work for a flat, buildless project. It silently
	# serves the wrong thing for any project with a build step (Kaixin's
	# Vite build, Samantha's Next.js static export): their real output
	# lives in a nested subfolder (dist/, out/) that only vercel.json's
	# "/<slug>/" rewrite actually points at. See vercel.json's own header
	# comment for the full reasoning.
	var contributors: Array[Dictionary] = [
		_person("Amanda Ng", Vector3(-12, 0, -13), Vector3(-10.5, 0, -11.3), "amanda", "/amanda/", "Beary is ready to serve up something sweet. Have a look around the shop.", _appearance("soft", HEIGHT_LESS_TALL, Color("d9a47e"), Color("171311"), "very_long_full", "none", "none", Color("191919"), true, Color("191919"), Color("5b3a29"))),
		_person("Amy Fu", Vector3(-7.0, 0, -13), Vector3(-5.2, 0, -11.3), "amy_gacha", "/amy/", "Give the knob a turn. Every capsule has a little Kueh surprise inside.", _appearance("soft", HEIGHT_LESS_TALL, Color("d9a47e"), Color("171311"), "less_shoulder", "rect", "colored_upper_arm", Color("18283f"), false, Color("18283f"), Color("5b3a29"))),
		_person("Azri", Vector3(-5.5, 0, 13.5), Vector3.ZERO, "", "", "This is pretty cool. What does Kueh Machine mean again?", _appearance("slim", HEIGHT_TALL, Color("d9a47e"), Color("3f2a20"), "buzzcut", "round", "short", Color("287fc2"), false, Color("18283f"), Color("5b3a29"))),
		_person("Ken Lee", Vector3(-0.6, 0, -13), Vector3(-2.4, 0, -11.3), "ken_gacha", "/ken/", "Try your luck, you might get a rare one.", _appearance("broad", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "hero", "none", "short", Color("191919"), false, Color("191919"), Color("fbf6ec"))),
		_person("Geraldine Chua", Vector3(6, 0, -13), Vector3.ZERO, "", "", "Just out for a stroll today, taking it all in.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "less_shoulder", "rect", "colored_upper_arm", Color("191919"), false, Color("191919"), Color("5b3a29"))),
		_person("Jesslyn Teo", Vector3(-14, 0, -9), Vector3(-11.7, 0, -9), "jesslyn", "/jesslyn/", "A good birthday starts with knowing what you can spend. Mine helps you plan the whole day.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("3f2a20"), "full_long", "round", "none", Color("d97b66"), false, Color("f0b429"), Color("5b3a29"))),
		_person("Kaixin Cai", Vector3(-14, 0, -3), Vector3(-11.7, 0, -3), "kaixin", "/kaixin/", "Pick a tune and sing it properly. The Kueh puns are part of the experience.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "ponytail_short", "head", "colored_upper_arm", Color("150f1e"), false, Color("191919"), Color("5b3a29")).merged({"shirt_pattern": "kaixin_polka"})),
		_person("Kevin Dreher", Vector3(-14, 0, 3), Vector3.ZERO, "", "", "Hallo! Hier wohne ich jetzt.", _appearance("broad", HEIGHT_TALL, Color("f3cfb8"), Color("d2aa63"), "buzzcut", "none", "short", Color("fbf6ec"), false, Color("18283f"), Color("5b3a29"))),
		_person("Leonard Reese", Vector3(0, 0, 11), Vector3.ZERO, "", "", "I'm just glad to be here.", _appearance("slim", HEIGHT_MORE_TALL, Color("f3cfb8"), Color("3f2a20"), "hero", "none", "short", Color("191919"), false, Color("191919"), Color("5b3a29"))),
		_person("Li Wei Lim", Vector3(14, 0, -1.8), Vector3(11.7, 0, 0), "lapis_arcade", "/liwei/", "The snake keeps growing, just like the layers of a good lapis. See how long you can last.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "ponytail_long", "none", "colored_upper_arm", Color("8fbf7f"), false, Color("8bb4d6"), Color("5b3a29"))),
		_person("Mei Jun Chew", Vector3(-14, 0, 9), Vector3(-11.7, 0, 9), "meijun", "/meijun/", "Taste has a way of taking you home. This is where I keep those memories.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("3f2a20"), "ponytail_long", "round", "colored_upper_arm", Color("fbf6ec"), false, Color("777a7c"), Color("287fc2"))),
		_person("Natalia Lionardy", Vector3(14, 0, -7.8), Vector3(11.7, 0, -6), "water_glass", "/natalia/", "Log a drink and watch the kueh lupis come together, stage by stage, until you hit your goal.", _appearance("soft", HEIGHT_LESS_TALL, Color("d9a47e"), Color("171311"), "less_shoulder", "rect", "long", Color("fbf6ec"), false, Color("18283f"), Color("8bb4d6"))),
		_person("Nicole Ng", Vector3(12, 0, -13), Vector3.ZERO, "nicole_calculator", "/nicole/", "Go on—calculate how much life you have left. Try not to take the result personally.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "less_shoulder", "head", "colored_upper_arm", Color("777a7c"), false, Color("191919"), Color("777a7c"))),
		_person("Ruth Yong", Vector3(14, 0, 4.8), Vector3(11.7, 0, 3), "bakery_arcade", "/ruth/", "Stack the Kueh carefully. The bakery gets much busier once you find your rhythm.", _appearance("soft", HEIGHT_LESS_TALL, Color("d9a47e"), Color("6a4632"), "bun", "none", "colored_upper_arm", Color("f2b8c6"), false, Color("18283f"), Color("5b3a29"))),
		_person("Samantha Tan", Vector3(14, 0, 9), Vector3(11.7, 0, 9), "remember", "/samantha/", "Pick an era and follow the devices that carried its songs. Some memories start with a play button.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("3f2a20"), "ponytail_long", "none", "colored_upper_arm", Color("fbf6ec"), false, Color("d97b66"), Color("5b3a29"))),
		_person("Sophia Himawan", Vector3(14, 0, 15), Vector3(11.7, 0, 15), "cat_scan", "/sophia/", "The cats have already mapped this corner. Mine helps you spot their friends around the neighborhood.", _appearance("soft", HEIGHT_TALL, Color("d9a47e"), Color("171311"), "full_long", "none", "none", Color("191919"), false, Color("18283f"), Color("5b3a29"))),
		_person("Viki Yap", Vector3(-14, 0, 15), Vector3(-11.7, 0, 15), "viki", "/viki/", "Build a kueh nobody's auntie has made yet.", _appearance("soft", HEIGHT_LESS_TALL, Color("d9a47e"), Color("6a4632"), "full_long", "none", "colored_upper_arm", Color("191919"), false, Color("8bb4d6"), Color("5b3a29"))),
	]
	_apply_even_hub_layout(contributors)
	return contributors

func _apply_even_hub_layout(contributors: Array[Dictionary]) -> void:
	# Venue-local placements replace the old perimeter gallery. Every project
	# continues to use its canonical contributor record; only its spatial role and
	# presentation change here.
	var layout := {
		# Arcade: every free-standing exhibit hugs a side wall and faces inward,
		# preserving a wide, uninterrupted entrance-to-stage circulation spine.
		# Gacha bank: two neighboring machines along the left wall.
		"Amy Fu": {"display": Vector3(-15.0, 0, 0.7), "display_facing": deg_to_rad(90.0), "npc": Vector3(-13.4, 0, 2.0), "roaming": true, "ambient_dialog": true, "roam_bounds": [Rect2(-13.7, -8.7, 3.4, 11.5)], "npc_dialog": "My gacha machine is along the wall with Ken's. Go see what comes out.", "display_title": "Kueh Machine", "display_dialog": "A capsule machine filled with tiny Kueh surprises. Some pulls are rarer than others."},
		"Ken Lee": {"display": Vector3(-15.0, 0, -2.5), "display_facing": deg_to_rad(90.0), "npc": Vector3(-13.2, 0, -1.2), "roaming": true, "ambient_dialog": true, "roam_bounds": [Rect2(-13.7, -8.7, 3.4, 11.5)], "npc_dialog": "Mine's the gacha next to Amy's. We put them together so you can compare your luck.", "display_title": "Gatcha-Kueh", "display_dialog": "Turn the knob and see which Kueh character tumbles out."},
		# The microphone and Kaixin both sit just into the curved stage lip. A
		# slight 4 cm visual sink removes any apparent gap against the deck.
		"Kaixin Cai": {"display": Vector3(-12.0, 0.44, -10.15), "display_facing": PI, "npc": Vector3(-13.1, 0.44, -10.65), "fixed_npc": true, "ambient_dialog": true, "npc_dialog": "The karaoke stage is ready. The microphone is less scary once the music starts.", "display_title": "Kara-o-kueh", "display_dialog": "A karaoke stage where every song title gets a Kueh-flavored twist."},
		# Cabinet bank: both games occupy the opposite wall and face inward.
		"Li Wei Lim": {"display": Vector3(-8.72, 0, -0.6), "display_facing": deg_to_rad(-90.0), "npc": Vector3(-10.6, 0, 0.8), "roaming": true, "ambient_dialog": true, "roam_bounds": [Rect2(-13.7, -8.7, 3.4, 11.5)], "npc_dialog": "My cabinet has the layered snake game. Try not to tie yourself in knots.", "display_title": "Lapis", "display_dialog": "A layered spin on Snake: keep growing without folding into yourself."},
		"Ruth Yong": {"display": Vector3(-8.72, 0, -4.7), "display_facing": deg_to_rad(-90.0), "npc": Vector3(-10.7, 0, -3.3), "roaming": true, "ambient_dialog": true, "roam_bounds": [Rect2(-13.7, -8.7, 3.4, 11.5)], "npc_dialog": "There's my game—give it a try. The bakery gets busy quickly.", "display_title": "Kueh Bakery", "display_dialog": "Stack and serve colorful Kueh as the bakery rush gets faster."},
		"Samantha Tan": {"display": Vector3(-14.55, 0, -6.55), "display_facing": deg_to_rad(90.0), "npc": Vector3(-15.55, 0, -6.55), "fixed_npc": true, "display_title": "Remember.fm", "display_dialog": "A retro music archive tuned through the devices and sounds that carried each era."},
		# Gallery: each presenter and plinth form a shoulder-to-shoulder pair
		# along a side wall. They share the same x coordinate and differ in z,
		# so neither display sits between its presenter and the room.
		"Nicole Ng": {"display": Vector3(-1.65, 0, 2.15), "display_facing": deg_to_rad(-90.0), "npc": Vector3(-1.65, 0, 0.45), "npc_facing": deg_to_rad(-90.0), "fixed_npc": true},
		"Jesslyn Teo": {"display": Vector3(-6.35, 0, -0.35), "display_facing": deg_to_rad(90.0), "npc": Vector3(-6.35, 0, -2.05), "npc_facing": deg_to_rad(90.0), "fixed_npc": true},
		# Restaurant: Viki and Natalia are represented by authored fixtures
		# supplied by ShophouseStreet, so their old pedestal kinds are disabled.
		"Mei Jun Chew": {"display": Vector3(4.0, 0, -12.50), "npc": Vector3(3.0, 0, -11.3), "fixed_npc": true},
		"Viki Yap": {"display_kind": "", "npc": Vector3(5.15, 0, -7.65)},
		"Natalia Lionardy": {"display_kind": "", "npc": Vector3(2.45, 0, -4.15)},
		# Outdoor ambient cast: all share a safe strip in front of the arcade.
		"Azri": {"display_kind": "", "npc": Vector3(-7.0, 0, 10.5), "roaming": true},
		"Geraldine Chua": {"display_kind": "", "npc": Vector3(-2.0, 0, 12.2), "roaming": true, "ambient_dialog": true},
		"Kevin Dreher": {"display_kind": "", "npc": Vector3(4.5, 0, 10.0), "roaming": true},
		"Leonard Reese": {"display_kind": "", "npc": Vector3(0.5, 0, 9.4), "roaming": true, "ambient_dialog": true, "npc_dialog": "I'm just glad to be here."},
		"Sophia Himawan": {"display_kind": "", "npc": Vector3(10.0, 0, 12.0), "roaming": true, "ambient_dialog": true, "npc_dialog": "The cats are the real guides around here. Follow one and take a closer look."},
		"Amanda Ng": {"display": Vector3(14.25, 0, 6.35), "display_facing": 0.0, "npc": Vector3(9.75, 0, 6.55), "fixed_npc": true, "roaming": true, "roam_bounds": [Rect2(9.45, 6.45, 3.35, 1.85)], "ambient_dialog": true, "npc_dialog": "Beary's is right here. Have a look around the shop, there's something sweet waiting inside."},
	}
	for index in range(contributors.size()):
		var contributor: Dictionary = contributors[index]
		var placement: Dictionary = layout.get(contributor["name"], {})
		if placement.has("npc"):
			contributor["position"] = placement["npc"]
		if placement.has("display"):
			contributor["display_position"] = placement["display"]
		if placement.has("display_facing"):
			contributor["display_facing"] = placement["display_facing"]
		if placement.has("display_kind"):
			contributor["display"] = placement["display_kind"]
		if placement.has("roaming"):
			contributor["roaming"] = placement["roaming"]
			# The outdoor ambient cast's default area now also includes the
			# White Gallery's and Kueh Restaurant's own interior floor (front
			# dining area only -- short of the restaurant's kitchen and the
			# gallery's solid rear block), so they can wander in and out of
			# those two venues, not just pace the plaza outside every
			# shopfront. Gallery and restaurant are kept as two SEPARATE
			# areas (not one rect spanning both buildings' width) -- see
			# hub_roaming_npc.gd's _pick_target(), which requires area 0 to
			# be the connecting outdoor zone: a single combined rect let a
			# next-target pick land on the far side of the shared party wall
			# between the two buildings, walking the NPC straight through it
			# instead of back out and in through the other doorway.
			# Each interior rect is pulled in 0.5m from its own side walls (so
			# a shoulder doesn't graze a party wall when approaching a random
			# target at an angle) and stops 1m short of the shopfront's own
			# door-gap threshold at z=5 -- an idle REST target landing right
			# in the doorway itself was the actual cause of NPCs "stalling"
			# and blocking entry; only the explicit door_waypoints below ever
			# put a walk that close to the threshold, and those are transit
			# points, never a resting destination.
			contributor["roam_bounds"] = placement.get("roam_bounds", [
				Rect2(-14.5, 8.0, 29.0, 5.8), Rect2(-7.5, -4.0, 7.0, 8.0), Rect2(0.5, -4.0, 7.0, 8.0)
			])
			# Gallery's and restaurant's shopfront door gaps are each exactly
			# centered on their own bay's center_x (the two side panels sit
			# symmetrically at center_x +/- 2.62, each 1.38 wide). Each entry
			# is an [outer, inner] pair straddling the panel plane (it spans
			# z=[4.7,5.3]) by 0.3m on both sides, not one point sitting inside
			# the wall's own thickness -- see hub_roaming_npc.gd's
			# door_waypoints doc comment for why a walk needs both, not a
			# direct line, to keep a shoulder-width margin off the panel
			# regardless of the angle it's approached from.
			contributor["door_waypoints"] = placement.get("door_waypoints", [
				null, [Vector2(-4.0, 5.6), Vector2(-4.0, 4.4)], [Vector2(4.0, 5.6), Vector2(4.0, 4.4)]
			] if not placement.has("roam_bounds") else [])
		if placement.has("ambient_dialog"):
			contributor["ambient_dialog"] = placement["ambient_dialog"]
		if placement.has("npc_dialog"):
			contributor["dialog"] = placement["npc_dialog"]
		if placement.has("npc_facing"):
			contributor["npc_facing"] = placement["npc_facing"]
		if placement.has("display_title"):
			contributor["display_title"] = placement["display_title"]
		if placement.has("display_dialog"):
			contributor["display_dialog"] = placement["display_dialog"]
		if placement.has("fixed_npc"):
			contributor["fixed_npc_position"] = placement["fixed_npc"]
		contributors[index] = contributor

func _indoor_venue_center(contributor_name: String) -> Vector3:
	if contributor_name in ["Amy Fu", "Ken Lee", "Kaixin Cai", "Li Wei Lim", "Ruth Yong", "Samantha Tan"]:
		return Vector3(-12.0, 0, -3.5)
	if contributor_name in ["Nicole Ng", "Jesslyn Teo"]:
		return Vector3(-4.0, 0, 0.5)
	if contributor_name in ["Mei Jun Chew", "Viki Yap", "Natalia Lionardy"]:
		return Vector3(4.0, 0, -3.5)
	if contributor_name == "Amanda Ng":
		return Vector3(12.0, 0, 6.35)
	return Vector3.INF

func _person(person_name: String, position: Vector3, display_position: Vector3, display: String, url: String, dialog: String, appearance: Dictionary) -> Dictionary:
	return {"name": person_name, "position": position, "display_position": display_position, "display": display, "url": url, "dialog": dialog, "appearance": appearance}

# Every contributor's look is built entirely from CharacterEditor's own
# selectable options -- the same 3 Build presets, 3 heights, palette swatches,
# hair styles, glasses choices, and Top/Bottom styles a claiming contributor
# sees in the live editor -- so a claimed character's default_appearance can
# start from exactly this dictionary with no custom tweak that only hub_main
# itself knows how to render.
func _appearance(body_preset: String, height_choice: float, skin: Color, hair: Color, hair_style: String, glasses_choice: String, sleeve_style: String, top: Color, wears_dress: bool, bottom: Color, shoes: Color) -> Dictionary:
	var result := {
		"body_preset": body_preset, "height_scale": height_choice,
		"skin": skin, "hair": hair, "hair_style": hair_style,
		"glasses": glasses_choice != "none",
		"round_glasses": glasses_choice == "round",
		"glasses_on_hair": glasses_choice == "head",
		"sleeve_style": sleeve_style, "top": top,
		"dress": wears_dress, "bottom": bottom, "shoes": shoes,
	}
	result.merge(CharacterEditor.BODY_PRESETS.get(body_preset, CharacterEditor.BODY_PRESETS["slim"]), true)
	return result

## A signed-out visitor has no saved character, so their player figure gets a
## fresh random pick from the same CharacterEditor-selectable option space
## every load -- never a custom value outside what the live editor could
## itself produce. Rerolled on every Hub load; not persisted anywhere, since
## there is no account to persist it against.
func _random_player_appearance() -> Dictionary:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var body_preset: String = CharacterEditor.BODY_PRESETS.keys()[rng.randi_range(0, CharacterEditor.BODY_PRESETS.size() - 1)]
	var height_choice: float = [HEIGHT_LESS_TALL, HEIGHT_TALL, HEIGHT_MORE_TALL][rng.randi_range(0, 2)]
	var skin := Color(CharacterEditor.SKIN_SWATCHES[rng.randi_range(0, CharacterEditor.SKIN_SWATCHES.size() - 1)])
	var hair := Color(CharacterEditor.HAIR_SWATCHES[rng.randi_range(0, CharacterEditor.HAIR_SWATCHES.size() - 1)])
	var hair_style: String = CharacterEditor.HAIR_STYLES[rng.randi_range(0, CharacterEditor.HAIR_STYLES.size() - 1)]["value"]
	var glasses_choice: String = ["none", "rect", "round", "head"][rng.randi_range(0, 3)]
	var sleeve_style: String = ["none", "short", "colored_upper_arm", "long"][rng.randi_range(0, 3)]
	var top := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	var bottom := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	var shoes := Color(CharacterEditor.CLOTH_SWATCHES[rng.randi_range(0, CharacterEditor.CLOTH_SWATCHES.size() - 1)])
	# A skirt only reads as intentional on the "Soft" preset, the same pairing
	# every dress-wearing contributor above already uses.
	var wears_dress := body_preset == "soft" and rng.randf() < 0.5
	return _appearance(body_preset, height_choice, skin, hair, hair_style, glasses_choice, sleeve_style, top, wears_dress, bottom, shoes)
