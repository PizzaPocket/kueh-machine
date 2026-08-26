extends Node3D

const INTERACT_DISTANCE := 3.2
const KUEH_WORDMARK_MESH: Mesh = preload("res://assets/wordmark/kueh_syne_800.obj")
const MACHINE_WORDMARK_MESH: Mesh = preload("res://assets/wordmark/machine_syne_600.obj")
const PLAYER_RESPONSES := {
	"Azri": "Er... it's hard to explain.",
	"Geraldine Chua": "Thanks, G. You're the best.",
	"Kevin Dreher": "Klingt gut, Kevin. Ich komme später wieder.",
}

var _player: HubPlayer
var _ui: HubUI
var _npcs: Array[HubNPC] = []
var _nearby: HubNPC
var _logo: Node3D
var _logo_origin_y := 0.0
var _elapsed := 0.0

func _ready() -> void:
	_setup_input()
	_build_environment()
	_player = HubPlayer.new()
	_player.position = Vector3(0, 0.08, 18)
	add_child(_player)
	_player.interact_requested.connect(_talk_to_nearby)
	_build_contributors()
	_build_sophia_cats()
	_ui = HubUI.new()
	add_child(_ui)
	await get_tree().create_timer(1.35).timeout
	await _ui.finish_loading()
	_player.input_locked = false

func _process(_delta: float) -> void:
	_update_nearby()

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
	environment.background_color = Color("ffffff")
	# Linear output keeps the color-background void genuinely white. Lighting
	# energy is reduced independently below, so lowering scene brightness does
	# not turn the sky into the grey produced by a sub-1 background multiplier.
	environment.background_energy_multiplier = 1.0
	environment.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	environment.tonemap_exposure = 1.0
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	# A restrained, slightly cool fill gives the unlit sides readable form
	# without flattening every material to white.
	environment.ambient_light_color = Color("e8edf2")
	environment.ambient_light_energy = 0.18
	environment.ambient_light_sky_contribution = 0.0
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
	key_light.light_energy = 0.44
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
		var npc_position: Vector3 = data["position"]
		var display_kind: String = data.get("display", "")
		if not display_kind.is_empty():
			var display_position: Vector3 = data["display_position"]
			var inward: Vector3 = (Vector3.ZERO - display_position).normalized()
			var display := DisplayBuilder.build(self, display_kind, display_position)
			# Every project's interactive/front face points into the room.
			display.rotation.y = atan2(inward.x, inward.z)
			# Place the presenter beside—not behind—their display. There are two
			# valid lateral sides; retain whichever one is nearest their authored
			# layout position so the room's grouping stays intentional. A 1.12 m
			# centre offset keeps figures visually close while clearing the widest
			# cabinet casing and the figure's relaxed stance.
			var lateral := Vector3(inward.z, 0, -inward.x)
			var side_a := display_position + lateral * 1.12
			var side_b := display_position - lateral * 1.12
			var authored_position: Vector3 = data["position"]
			npc_position = side_a if side_a.distance_squared_to(authored_position) <= side_b.distance_squared_to(authored_position) else side_b
		var npc := HubNPC.new()
		npc.position = npc_position
		add_child(npc)
		npc.setup(data, _player)
		_npcs.append(npc)

func _build_sophia_cats() -> void:
	var first := HubCat.new()
	first.name = "SophiasRoamingCatA"
	first.coat_color = CatFigure.COAT_COLORS[1]
	first.position = Vector3(7.5, 0, 9.6)
	add_child(first)
	var second := HubCat.new()
	second.name = "SophiasRoamingCatB"
	second.coat_color = CatFigure.COAT_COLORS[3]
	second.position = Vector3(5.0, 0, 12.2)
	add_child(second)

func _update_nearby() -> void:
	if _player == null or _ui == null or _player.input_locked:
		return
	var closest: HubNPC = null
	var closest_distance := INTERACT_DISTANCE
	for npc in _npcs:
		var distance := _player.global_position.distance_to(npc.global_position)
		if distance < closest_distance:
			closest = npc
			closest_distance = distance
	_nearby = closest
	_ui.set_prompt(_nearby != null)

func _talk_to_nearby() -> void:
	if _nearby == null:
		return
	_player.input_locked = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_ui.set_prompt(false)
	var data := _nearby.contributor
	var actions: Array[Dictionary] = []
	var player_response: String = PLAYER_RESPONSES.get(data["name"], "")
	if not player_response.is_empty():
		actions.append({
			"label": player_response,
			"callback": func() -> void:
				DialogUI.hide_dialog()
				_on_dialog_closed()
		})
	var url: String = data.get("url", "")
	if not url.is_empty():
		actions.append({
			"label": "View project." if data["name"] == "Nicole Ng" else "Visit project.",
			"callback": func() -> void:
				DialogUI.hide_dialog()
				_visit_project(url)
				_on_dialog_closed()
		})
	var dismiss_label := "" if PLAYER_RESPONSES.has(data["name"]) else "Goodbye."
	DialogUI.show_line(data["name"], data["dialog"], actions, dismiss_label, _on_dialog_closed)

func _on_dialog_closed() -> void:
	_player.input_locked = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _visit_project(url: String) -> void:
	if OS.has_feature("web"):
		var window := JavaScriptBridge.get_interface("window")
		window.open(url, "_self")
	else:
		OS.shell_open(url)

func _contributors() -> Array[Dictionary]:
	var contributors: Array[Dictionary] = [
		_person("Amanda Ng", Vector3(-12, 0, -13), Vector3(-10.5, 0, -11.3), "amanda", "/machines/amanda/", "Beary is ready to serve up something sweet. Have a look around the shop.", _appearance(0.86, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "very_long_full", Color("151515"), Color("161616"), false, false, true, true)),
		_person("Amy Fu", Vector3(-7.0, 0, -13), Vector3(-5.2, 0, -11.3), "amy_gacha", "/machines/amy/", "Give the knob a turn. Every capsule has a little Kueh surprise inside.", _appearance(0.90, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "medium_long", Color("1e314d"), Color("355677"), true)),
		_person("Azri", Vector3(-5.5, 0, 13.5), Vector3.ZERO, "", "", "This is pretty cool. What does Kueh Machine mean again?", _appearance(0.98, 1.02, HubPalette.TAN_SKIN, Color("443b37"), "buzzcut", Color("777a7c"), Color("242b35"), true, true, false, false, false, true)),
		_person("Ken Lee", Vector3(-0.6, 0, -13), Vector3(-2.4, 0, -11.3), "ken_gacha", "/machines/ken/", "Try your luck, you might get a rare one.", _appearance(0.98, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, FigureHair.STYLE_HERO, Color("171717"), Color("181818"), false, false, false, false, false, true, HubPalette.WHITE)),
		_person("Geraldine Chua", Vector3(6, 0, -13), Vector3.ZERO, "", "", "I'm taking in everyone else's machines today. My space will be ready later.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "less_shoulder", Color("171717"), Color("171717"), true)),
		_person("Jesslyn Teo", Vector3(-14, 0, -9), Vector3(-11.7, 0, -9), "jesslyn", "/machines/jesslyn/", "A good birthday starts with knowing what you can spend. Mine helps you plan the whole day.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, HubPalette.DARK_BROWN_HAIR, "long", Color("efaa88"), Color("d9c6a5"), true, true, false, true)),
		_person("Kaixin Cai", Vector3(-14, 0, -3), Vector3(-11.7, 0, -3), "kaixin", "/machines/kaixin/", "Pick a tune and sing it properly. The Kueh puns are part of the experience.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "less_shoulder", Color("150f1e"), Color("3a3a3c")).merged({"shirt_texture": HubPalette.polka_dot_texture(Color("150f1e"), Color("ff2e93"), 10, 256, 3.0)})),
		_person("Kevin Dreher", Vector3(-14, 0, 3), Vector3.ZERO, "", "", "I'm still translating what my corner should become. Come back when it is ready.", _appearance(1.09, 1.08, HubPalette.FAIR_SKIN, Color("d2aa63"), "buzzcut", HubPalette.WHITE, Color("355677"), false, false, false, false, false)),
		_person("Li Wei Lim", Vector3(14, 0, -1.8), Vector3(11.7, 0, 0), "lapis_arcade", "/machines/liwei/", "The snake keeps growing, just like the layers of a good lapis. See how long you can last.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "long", Color("315b43"), Color("355677"))),
		_person("Mei Jun Chew", Vector3(-14, 0, 9), Vector3(-11.7, 0, 9), "meijun", "/machines/meijun/", "Taste has a way of taking you home. This is where I keep those memories.", _appearance(0.98, 1.13, HubPalette.TAN_SKIN, Color("3f2a20"), "long", HubPalette.WHITE, Color("355677"), true, true).merged({"upper_arm_thickness": 1.15})),
		_person("Natalia Lionardy", Vector3(14, 0, -7.8), Vector3(11.7, 0, -6), "water_glass", "/machines/natalia/", "Care Island changes with the day. Slow down and see what is happening there now.", _appearance(0.90, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "shoulder", Color("f4f0e6"), Color("292d35")).merged({"sleeve_style": ProceduralFigure.SLEEVE_STYLE_LONG})),
		_person("Nicole Ng", Vector3(12, 0, -13), Vector3.ZERO, "nicole_calculator", "/machines/nicole/", "Go on—calculate how much life you have left. Try not to take the result personally.", _appearance(0.98, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "less_shoulder", Color("777a7c"), Color("d9c6a5"), true, false, false, false, true, false, Color("777a7c")).merged({"glasses_on_hair": true})),
		_person("Ruth Yong", Vector3(14, 0, 4.8), Vector3(11.7, 0, 3), "bakery_arcade", "/machines/ruth/", "Stack the Kueh carefully. The bakery gets much busier once you find your rhythm.", _appearance(0.87, 1.13, HubPalette.TAN_SKIN, HubPalette.DARK_BROWN_HAIR, "bun", Color("e887a5"), Color("355677"))),
		_person("Samantha Tan", Vector3(14, 0, 9), Vector3(11.7, 0, 9), "remember", "/machines/samantha/", "Pick an era and follow the devices that carried its songs. Some memories start with a play button.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, Color("443b37"), "very_long", HubPalette.WHITE, Color("d9c6a5"))),
		_person("Sophia Himawan", Vector3(14, 0, 15), Vector3(11.7, 0, 15), "cat_scan", "/machines/sophia/", "The cats have already mapped this corner. Mine helps you spot their friends around the neighborhood.", _appearance(1.04, 1.13, HubPalette.TAN_SKIN, HubPalette.BLACK_HAIR, "full_long", Color("494949"), Color("18283f"), false, false, false, true)),
		_person("Viki Yap", Vector3(-14, 0, 15), Vector3(-11.7, 0, 15), "viki", "/machines/viki/", "Build a kueh nobody's auntie has made yet.", _appearance(0.90, 1.13, HubPalette.TAN_SKIN, HubPalette.DARK_BROWN_HAIR, "long", Color("f2ede2"), Color("f2ede2"), false, false, true)),
	]
	_apply_even_hub_layout(contributors)
	return contributors

func _apply_even_hub_layout(contributors: Array[Dictionary]) -> void:
	# Three regular gallery runs leave the entrance side open. Each coordinate is
	# the centre of a presenter/display module; presenter side does not affect the
	# spacing calculation. The two thematic pairs occupy adjacent modules, with
	# their presenters hinted toward the outside edges of each pair.
	var layout := {
		# Back run, left to right.
		"Amanda Ng": {"display": Vector3(-9.0, 0, -11.0), "npc": Vector3(-10.7, 0, -11.0)},
		"Amy Fu": {"display": Vector3(-4.5, 0, -11.0), "npc": Vector3(-6.2, 0, -11.0)},
		"Ken Lee": {"display": Vector3(0.0, 0, -11.0), "npc": Vector3(1.7, 0, -11.0)},
		"Geraldine Chua": {"npc": Vector3(4.5, 0, -11.0)},
		"Mei Jun Chew": {"display": Vector3(9.0, 0, -11.0), "npc": Vector3(10.7, 0, -11.0)},
		"Azri": {"npc": Vector3(-5.5, 0, 13.5)},
		# Left run, back to front.
		"Jesslyn Teo": {"display": Vector3(-11.0, 0, -6.0), "npc": Vector3(-11.0, 0, -7.7)},
		"Kaixin Cai": {"display": Vector3(-11.0, 0, -1.5), "npc": Vector3(-11.0, 0, -3.2)},
		"Kevin Dreher": {"npc": Vector3(-11.0, 0, 3.0)},
		"Nicole Ng": {"display": Vector3(-11.0, 0, 7.5), "npc": Vector3(-11.0, 0, 5.8)},
		"Viki Yap": {"display": Vector3(-11.0, 0, 12.0), "npc": Vector3(-11.0, 0, 10.3)},
		# Right run, back to front. Li Wei and Ruth form one adjacent pair.
		"Natalia Lionardy": {"display": Vector3(11.0, 0, -6.0), "npc": Vector3(11.0, 0, -7.7)},
		"Li Wei Lim": {"display": Vector3(11.0, 0, -1.5), "npc": Vector3(11.0, 0, -3.2)},
		"Ruth Yong": {"display": Vector3(11.0, 0, 3.0), "npc": Vector3(11.0, 0, 4.7)},
		"Samantha Tan": {"display": Vector3(11.0, 0, 7.5), "npc": Vector3(11.0, 0, 5.8)},
		"Sophia Himawan": {"display": Vector3(11.0, 0, 12.0), "npc": Vector3(11.0, 0, 10.3)},
	}
	for index in range(contributors.size()):
		var contributor: Dictionary = contributors[index]
		var placement: Dictionary = layout.get(contributor["name"], {})
		if placement.has("npc"):
			contributor["position"] = placement["npc"]
		if placement.has("display"):
			contributor["display_position"] = placement["display"]
		contributors[index] = contributor

func _person(person_name: String, position: Vector3, display_position: Vector3, display: String, url: String, dialog: String, appearance: Dictionary) -> Dictionary:
	return {"name": person_name, "position": position, "display_position": display_position, "display": display, "url": url, "dialog": dialog, "appearance": appearance}

func _appearance(height_scale: float, build_scale: float, skin: Color, hair: Color, hair_style: String, top: Color, bottom: Color, glasses := false, round_glasses := false, dress := false, sleeveless := false, is_female := true, abdomen_matches_hips := false, shoe_override := Color(0, 0, 0, 0)) -> Dictionary:
	# Keep all contributors within a narrow adult-height band. The raised 0.99
	# floor stops "shortest" figures such as Amanda reading miniature beside the
	# 1.12 player, while preserving the authored ordering through 1.06.
	var distributed_height := remap(clampf(height_scale, 0.86, 1.09), 0.86, 1.09, 0.99, 1.06)
	var shoe_palette: Array[Color] = [Color("4c3325"), Color("714326"), Color("292827"), Color("ded6ca")]
	var shoe_index: int = absi((str(top) + str(bottom)).hash()) % shoe_palette.size()
	var chest_build_scale := minf(build_scale, 0.94) if is_female else build_scale
	var hip_build_scale := build_scale if is_female else minf(build_scale, 1.04)
	var abdomen_width_scale := build_scale if is_female else minf(build_scale, 1.08)
	var shoes: Color = shoe_palette[shoe_index] if is_zero_approx(shoe_override.a) else shoe_override
	return {"height_scale": distributed_height, "build_scale": build_scale, "chest_build_scale": chest_build_scale, "hip_build_scale": hip_build_scale, "abdomen_width_scale": abdomen_width_scale, "abdomen_matches_hips": abdomen_matches_hips, "skin": skin, "hair": hair, "hair_style": hair_style, "top": top, "bottom": bottom, "glasses": glasses, "round_glasses": round_glasses, "dress": dress, "sleeveless": sleeveless, "is_female": is_female, "sleeve_style": ProceduralFigure.SLEEVE_STYLE_NONE if sleeveless else ProceduralFigure.SLEEVE_STYLE_SHORT, "shoes": shoes}
